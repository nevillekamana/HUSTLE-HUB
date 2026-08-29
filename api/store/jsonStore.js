//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const fs = require('fs').promises;
const path = require('path');

//-----------------------------------------------------\\
//                     CONFIGURATION
//-----------------------------------------------------\\

//resolved from this file so the store finds the same data directory no
//matter which directory the api was started from
const DATA_DIR = path.join(__dirname, '..', 'data');

//-----------------------------------------------------\\
//                 ACCESS SERIALISATION
//-----------------------------------------------------\\

let pendingTask = Promise.resolve();

//runs tasks one at a time, a read followed by a write is only safe if no
//other caller can read the same snapshot in between the two steps
const withLock = async (task) => {
  const previousTask = pendingTask;
  let releaseTurn;
  pendingTask = new Promise((resolve) => {
    releaseTurn = resolve;
  });

  try {
    await previousTask;
  } catch (error) {
    //the previous caller already reported its own failure
  }

  try {
    return await task();
  } finally {
    releaseTurn();
  }
};

//a missing file is the normal first run state and yields an empty collection,
//any other failure is real and is passed up to the error handler
const loadFile = async (fileName) => {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, fileName), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

//written to a temporary file and renamed into place, a crash midway leaves the
//previous file intact rather than a half written one
const saveFile = async (fileName, records) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const target = path.join(DATA_DIR, fileName);
  const temporary = target + '.tmp';
  await fs.writeFile(temporary, JSON.stringify(records, null, 2) + '\n', 'utf8');
  await fs.rename(temporary, target);
  return records;
};

//-----------------------------------------------------\\
//                     DATA ACCESS
//-----------------------------------------------------\\

const readCollection = async (fileName) => withLock(async () => loadFile(fileName));

const writeCollection = async (fileName, records) => withLock(async () => saveFile(fileName, records));

//the only safe way to change a collection, the lock is held across the read
//and the write so two callers cannot both act on the same stale snapshot
const updateCollection = async (fileName, mutate) => withLock(async () => {
  const records = await loadFile(fileName);
  const updated = await mutate(records);
  await saveFile(fileName, updated);
  return updated;
});

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  readCollection,
  writeCollection,
  updateCollection
};
