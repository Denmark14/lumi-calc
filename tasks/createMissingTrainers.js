const fs = require('fs');
const path = require('path');
const parentFilePath = path.resolve(__dirname, '..');
const TRAINER_TABLE = require(path.join(parentFilePath, 'input', 'TrainerTable.json'));
const {getTrainerLabel, getTrainerName, getTrainerDataFromPlaceDatas} = require('./trainerUtils');

const BDSPTrainers = getTrainerDataFromPlaceDatas();

function findMissingTrainers(trainers) {
    const arr = [...Array(2000).keys()];
    arr.splice(0, 1);
    for(let trainer of trainers) {
        const idx = arr.findIndex(e => e === trainer.trainerId);
        arr.splice(idx, 1);
    }

    let volkners = [];
    let missingTrainers = [];
    for(let element of arr) {
        const trainerData = TRAINER_TABLE.TrainerData[element];
        const trainerType = TRAINER_TABLE.TrainerType[trainerData.TypeID];
        const trainerLabel = getTrainerLabel(trainerType.LabelTrType);
        const trainerName = getTrainerName(trainerData.NameLabel);

        if(trainerName === 'Volkner') {
            //We extended the trainer by duplicating Volkner trainers, therefore any Volkners outside of the docs' specified IDs should be considered undefined trainers
            volkners.push({ trainerId: element, name: trainerName, type: trainerLabel})
        } else {
            missingTrainers.push({ trainerId: element, name: trainerName, type: trainerLabel});
        }
    }

   return {
    volkners,
    missingTrainers
   }
}

module.exports = function() {
    const {missingTrainers} = findMissingTrainers(BDSPTrainers);
    fs.writeFileSync(path.join(parentFilePath, 'output', 'missingTrainers.json'), JSON.stringify(missingTrainers), 'utf-8');
};
