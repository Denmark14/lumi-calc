const fs = require('fs');
const path = require('path');
const parentFilePath = path.resolve(__dirname, '..');
const trainerNames = require(path.join(parentFilePath, 'input', 'english_dp_trainers_name.json'));
const trainerLabels = require(path.join(parentFilePath, 'input', 'english_dp_trainers_type.json'));
const TRAINER_TABLE = require(path.join(parentFilePath, 'input', 'TrainerTable.json'));
const bdspLocationFiles = fs.readdirSync(path.join(parentFilePath, 'placedatas'));
const areas = fs.readFileSync(path.join(parentFilePath, 'input', 'areas.csv'), 'utf8').split('\n').map(x => x.split(','));

const areaMap = {};

areas.forEach(x => {
    areaMap[x[0]] = x[4];
});

function getTrainerLabel(labelName) {
    return trainerLabels.labelDataArray.find(e => e.labelName === labelName)?.wordDataArray[0].str;
}

function getTrainerName(labelName) {
    return trainerNames.labelDataArray.find(e => e.labelName === labelName)?.wordDataArray[0].str;
}

function getTrainerDataFromPlaceDatas() {
    let trainers = [];
    for (let i = 0; i < bdspLocationFiles.length; i++) {
        const data = require('../placedatas/' + bdspLocationFiles[i])
        for (let event of data.Data) {
            if (event.TrainerID > 0 && event.TrainerID < 10000 && event.zoneID !== -1) {
                const trainerData = TRAINER_TABLE.TrainerData[event.TrainerID];
                const trainerType = TRAINER_TABLE.TrainerType[trainerData.TypeID];
                const trainerLabel = getTrainerLabel(trainerType.LabelTrType);
                const trainerName = getTrainerName(trainerData.NameLabel);

                trainers.push({ zoneName: areaMap[event.zoneID], zoneId: event.zoneID, trainerId: event.TrainerID, rematch: 0, name: trainerName, type: trainerLabel});
            }
        }
    }

    return trainers
}

function generateTrainerName(rawTrainerName, Pokemon1Level) {
    const level = parseInt(Pokemon1Level);
    if(isNaN(level)) return;

    const i1 = rawTrainerName.indexOf('[');
    const i2 = rawTrainerName.indexOf(']');

    const badSection = rawTrainerName.substring(i1, i2);
    const isBossTrainer = (badSection.includes('City') || badSection.includes('League'));
    if(!isBossTrainer || rawTrainerName.includes('Master')) return rawTrainerName;
    const trainerSubstring = rawTrainerName.substring(0, i1 - 1) + rawTrainerName.substring(i2 + 1);
    if(level === 100) return trainerSubstring + ' Rematch';
    return trainerSubstring;
}

module.exports = {
    getTrainerName,
    getTrainerLabel,
    getTrainerDataFromPlaceDatas,
    generateTrainerName
}