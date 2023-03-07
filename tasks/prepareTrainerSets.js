const fs = require('fs');
const path = require('path');
const parentFilePath = path.resolve(__dirname, '..');
const TRAINER_TABLE = require(path.join(parentFilePath, 'input', 'TrainerTable.json'));
const {getTrainerLabel, getTrainerName, getTrainerDataFromPlaceDatas} = require('./trainerUtils');
const {getPokemonName, getAbilityString, getNatureName, getMoves, getItemString} = require('./pokemonUtils');

if(!fs.existsSync(path.join(parentFilePath, 'output', 'LumiMons.json'))) {
    require('./createLumiMons')();
}

const speciesData = require('../output/LumiMons.json');
const BDSPTrainers = getTrainerDataFromPlaceDatas();

const unusedRematches = new Set();

for (let i = 0; i < TRAINER_TABLE.TrainerRematch.length; i++) {
    const trainer = TRAINER_TABLE.TrainerRematch[i]
    const baseID = trainer.BaseTrainerID
    const trainersIdx = BDSPTrainers.findIndex(t => t.trainerId === baseID);

    if (trainersIdx === -1) {
        unusedRematches.add(trainer);
        continue;
    }

    const rematchIds = new Set();
    if (trainer.Rematch_01 !== baseID) {
        rematchIds.add(trainer.Rematch_01);
    }
    if (trainer.Rematch_02 !== baseID) {
        rematchIds.add(trainer.Rematch_02);
    }
    if (trainer.Rematch_03 !== baseID) {
        rematchIds.add(trainer.Rematch_03);
    }
    if (trainer.Rematch_04 !== baseID) {
        rematchIds.add(trainer.Rematch_04);
    }
    if (trainer.Rematch_05 !== baseID) {
        rematchIds.add(trainer.Rematch_05);
    }

    let {zoneId, zoneName} = BDSPTrainers.find(e => e.trainerId === baseID);
    
    rematchIds.delete(0);

    for(let [idx, id] of Array.from(rematchIds).entries()) {
        const trainerData = TRAINER_TABLE.TrainerData[id];
        const trainerType = TRAINER_TABLE.TrainerType[trainerData.TypeID];
        const trainerLabel = getTrainerLabel(trainerType.LabelTrType);
        const trainerName = getTrainerName(trainerData.NameLabel);

        BDSPTrainers.push({ zoneName, zoneId, trainerId: id, rematch: idx + 1, name: trainerName, type: trainerLabel});
    }
}

const sets = require('../output/sets.json');

BDSPTrainers.forEach((e, i) => {
    const partyData = TRAINER_TABLE.TrainerPoke[e.trainerId];
    if(i === 0) return;
    const trainerString = `${e.type} ${e.name} ${e.name === 'Grunt' ? e.zoneName : ''}${e.rematch > 0 ? `[Rematch ${e.rematch}]` : '' }`
        .replaceAll('Team ', '')
        .replaceAll('Pokémon Trainer', '')
        .replaceAll('Pokémon ', '')
        .replace('Police ', '')
        .replace('Galactic ', '')
        .replace(' South', 'S')
        .replace(' North', 'N')
        .replace(' East', 'E')
        .replace(' West', 'W')
        .replace('Route ', 'R.')
        .replace('Mountain', 'Mount.')
        .trim();
    
    if(trainerString.length > 30) {
        //console.warn('Found a trainer name longer than 35 chars.\n', trainerString, trainerString.length);
    }
    if (!partyData.P1MonsNo) return;
    const p1Name = getPokemonName(partyData.P1MonsNo);
    let p1FormName = partyData.P1FormNo > 0 ? speciesData[p1Name].otherFormes[partyData.P1FormNo - 1] : null;
    const p1MonName = p1FormName ?? p1Name;
    if (sets[p1MonName] === undefined) {
        sets[p1MonName] = {};
    }

    sets[p1MonName][trainerString] = {
        level: partyData.P1Level,
        ability: getAbilityString(partyData.P1Tokusei),
        nature: getNatureName(partyData.P1Seikaku),
        ivs: {
            hp: partyData.P1TalentHp,
            at: partyData.P1TalentAtk,
            df: partyData.P1TalentDef,
            sa: partyData.P1TalentSpAtk,
            sd: partyData.P1TalentSpDef,
            sp: partyData.P1TalentAgi,
        },
        evs: {
            hp: partyData.P1EffortHp,
            at: partyData.P1EffortAtk,
            df: partyData.P1EffortDef,
            sa: partyData.P1EffortSpAtk,
            sd: partyData.P1EffortSpDef,
            sp: partyData.P1EffortAgi,
        },
        moves: getMoves(partyData.P1Waza1, partyData.P1Waza2, partyData.P1Waza3, partyData.P1Waza4, partyData.P1MonsNo, partyData.P1Level)
    }

    if (partyData.P1Item !== 0) {
        sets[p1MonName][trainerString].item = getItemString(partyData.P1Item);
    }

    if (!partyData.P2MonsNo) return;

    const p2monName = getPokemonName(partyData.P2MonsNo);
    let p2FormName = partyData.P2FormNo > 0 ? speciesData[p2monName].otherFormes[partyData.P2FormNo - 1] : null;
    const p2name = p2FormName ?? p2monName;
    if (sets[p2name] === undefined) {
        sets[p2name] = {};
    }

    sets[p2name][trainerString] = {
        level: partyData.P2Level,
        ability: getAbilityString(partyData.P2Tokusei),
        nature: getNatureName(partyData.P2Seikaku),
        ivs: {
            hp: partyData.P2TalentHp,
            at: partyData.P2TalentAtk,
            df: partyData.P2TalentDef,
            sa: partyData.P2TalentSpAtk,
            sd: partyData.P2TalentSpDef,
            sp: partyData.P2TalentAgi,
        },
        evs: {
            hp: partyData.P2EffortHp,
            at: partyData.P2EffortAtk,
            df: partyData.P2EffortDef,
            sa: partyData.P2EffortSpAtk,
            sd: partyData.P2EffortSpDef,
            sp: partyData.P2EffortAgi,
        },
        moves: getMoves(partyData.P2Waza1, partyData.P2Waza2, partyData.P2Waza3, partyData.P2Waza4, partyData.P2MonsNo, partyData.P2Level)
    }

    if (partyData.P2Item !== 0) {
        sets[p2name][trainerString].item = getItemString(partyData.P2Item);
    }

    if (!partyData.P3MonsNo) return;

    const p3monName = getPokemonName(partyData.P3MonsNo);
    let p3FormName = partyData.P3FormNo > 0 ? speciesData[p3monName].otherFormes[partyData.P3FormNo - 1] : null;
    const p3name = p3FormName ?? p3monName;

    if (sets[p3name] === undefined) {
        sets[p3name] = {};
    }

    sets[p3name][trainerString] = {
        level: partyData.P3Level,
        ability: getAbilityString(partyData.P3Tokusei),
        nature: getNatureName(partyData.P3Seikaku),
        ivs: {
            hp: partyData.P3TalentHp,
            at: partyData.P3TalentAtk,
            df: partyData.P3TalentDef,
            sa: partyData.P3TalentSpAtk,
            sd: partyData.P3TalentSpDef,
            sp: partyData.P3TalentAgi,
        },
        evs: {
            hp: partyData.P3EffortHp,
            at: partyData.P3EffortAtk,
            df: partyData.P3EffortDef,
            sa: partyData.P3EffortSpAtk,
            sd: partyData.P3EffortSpDef,
            sp: partyData.P3EffortAgi,
        },
        moves: getMoves(partyData.P3Waza1, partyData.P3Waza2, partyData.P3Waza3, partyData.P3Waza4, partyData.P3MonsNo, partyData.P3Level)
    }

    if (partyData.P3Item !== 0) {
        sets[p3name][trainerString].item = getItemString(partyData.P3Item);
    }

    if (!partyData.P4MonsNo) return;

    const p4monName = getPokemonName(partyData.P4MonsNo);
    let p4FormName = partyData.P4FormNo > 0 ? speciesData[p4monName].otherFormes[partyData.P4FormNo - 1] : null;
    const p4name = p4FormName ?? p4monName;

    if (sets[p4name] === undefined) {
        sets[p4name] = {};
    }

    sets[p4name][trainerString] = {
        level: partyData.P4Level,
        ability: getAbilityString(partyData.P4Tokusei),
        nature: getNatureName(partyData.P4Seikaku),
        ivs: {
            hp: partyData.P4TalentHp,
            at: partyData.P4TalentAtk,
            df: partyData.P4TalentDef,
            sa: partyData.P4TalentSpAtk,
            sd: partyData.P4TalentSpDef,
            sp: partyData.P4TalentAgi,
        },
        evs: {
            hp: partyData.P4EffortHp,
            at: partyData.P4EffortAtk,
            df: partyData.P4EffortDef,
            sa: partyData.P4EffortSpAtk,
            sd: partyData.P4EffortSpDef,
            sp: partyData.P4EffortAgi,
        },
        moves: getMoves(partyData.P4Waza1, partyData.P4Waza2, partyData.P4Waza3, partyData.P4Waza4, partyData.P4MonsNo, partyData.P4Level)
    }

    if (partyData.P4Item !== 0) {
        sets[p4name][trainerString].item = getItemString(partyData.P4Item);
    }

    if (!partyData.P5MonsNo) return;
    const p5monName = getPokemonName(partyData.P5MonsNo);
    let p5FormName = partyData.P5FormNo > 0 ? speciesData[p5monName].otherFormes[partyData.P5FormNo - 1] : null;
    const p5name = p5FormName ?? p5monName;

    if (sets[p5name] === undefined) {
        sets[p5name] = {};
    }

    sets[p5name][trainerString] = {
        level: partyData.P5Level,
        ability: getAbilityString(partyData.P5Tokusei),
        nature: getNatureName(partyData.P5Seikaku),
        ivs: {
            hp: partyData.P5TalentHp,
            at: partyData.P5TalentAtk,
            df: partyData.P5TalentDef,
            sa: partyData.P5TalentSpAtk,
            sd: partyData.P5TalentSpDef,
            sp: partyData.P5TalentAgi,
        },
        evs: {
            hp: partyData.P5EffortHp,
            at: partyData.P5EffortAtk,
            df: partyData.P5EffortDef,
            sa: partyData.P5EffortSpAtk,
            sd: partyData.P5EffortSpDef,
            sp: partyData.P5EffortAgi,
        },
        moves: getMoves(partyData.P5Waza1, partyData.P5Waza2, partyData.P5Waza3, partyData.P5Waza4, partyData.P5MonsNo, partyData.P5Level)
    }

    if (partyData.P5Item !== 0) {
        sets[p5name][trainerString].item = getItemString(partyData.P5Item);
    }

    if (!partyData.P6MonsNo) return;
    const p6monName = getPokemonName(partyData.P6MonsNo);
    let p6FormName = partyData.P6FormNo > 0 ? speciesData[p6monName].otherFormes[partyData.P6FormNo - 1] : null;
    const p6name = p6FormName ?? p6monName;

    if (sets[p6name] === undefined) {
        sets[p6name] = {};
    }

    sets[p6name][trainerString] = {
        level: partyData.P6Level,
        ability: getAbilityString(partyData.P6Tokusei),
        nature: getNatureName(partyData.P6Seikaku),
        ivs: {
            hp: partyData.P6TalentHp,
            at: partyData.P6TalentAtk,
            df: partyData.P6TalentDef,
            sa: partyData.P6TalentSpAtk,
            sd: partyData.P6TalentSpDef,
            sp: partyData.P6TalentAgi,
        },
        evs: {
            hp: partyData.P6EffortHp,
            at: partyData.P6EffortAtk,
            df: partyData.P6EffortDef,
            sa: partyData.P6EffortSpAtk,
            sd: partyData.P6EffortSpDef,
            sp: partyData.P6EffortAgi,
        },
        moves: getMoves(partyData.P6Waza1, partyData.P6Waza2, partyData.P6Waza3, partyData.P6Waza4, partyData.P6MonsNo, partyData.P6Level)
    }

    if (partyData.P6Item !== 0) {
        sets[p6name][trainerString].item = getItemString(partyData.P6Item);
    }
});


const filepath = path.join(parentFilePath, 'output')
fs.writeFileSync(path.join(filepath, 'trainerSets.json'), JSON.stringify(sets), 'utf-8');

module.exports = function(){
    //Overwrite the gen8 js file
    fs.writeFileSync(
        path.join(parentFilePath, 'src', 'js', 'data', 'sets', 'gen8.js'),  
        `var SETDEX_SS = ${JSON.stringify({ ...sets })}`,
        'utf-8'
    );
}