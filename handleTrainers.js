const fs = require('fs');
const path = require('path');
const trainerNames = require(path.join(__dirname, 'input', 'english_dp_trainers_name.json'));
const trainerLabels = require(path.join(__dirname, 'input', 'english_dp_trainers_type.json'));
const TRAINER_TABLE = require(path.join(__dirname, 'input', 'TrainerTable.json'));
const areas = fs.readFileSync(path.join(__dirname, 'input', 'areas.csv'), 'utf8').split('\n').map(x => x.split(','));
const bdspLocationFiles = fs.readdirSync(path.join(__dirname, 'placedatas'));

const pokemonData = require('./input/PersonalTable.json');
const NameData = require('./input/english_ss_monsname.json');
const AbilityNameData = require('./input/english_ss_tokusei.json');
const typeNameData = require('./input/english_ss_typename.json');
const formNames = require('./input/english_ss_zkn_form.json');
const learnset = require('./input/WazaOboeTable.json');
const natureNameData = require('./input/english_ss_seikaku.json');
const itemNameData = require('./input/english_ss_itemname.json');
const SMOGON_MOVES = require('./input/moves.json');



const areaMap = {};
areas.forEach(x => {
    areaMap[x[0]] = x[4];
});

const moveEnum = fs.readFileSync(path.join(__dirname, 'input', 'moves.txt'), 'utf-8').split('\n').map(e => e.trim()).filter(e => e);

function getTypes(e) {
    return e.type1 === e.type2 ? [getTypeName(e.type1)] : [getTypeName(e.type1), getTypeName(e.type2)];
}

function getTypeName(typeId) {
    return typeNameData.labelDataArray[typeId].wordDataArray[0].str;
}

function makeAbilityObject(ha) {
    const abilitiyString = AbilityNameData.labelDataArray[ha].wordDataArray[0].str;

    return { 0: abilitiyString };
}

function getPokemonName(id) {
    try {
        const Name = NameData.labelDataArray[id].wordDataArray[0].str;
        Name.replace('♀', '-F')
        Name.replace('♂', '-M')
        Name.replace('’', '\u2019')
        return Name;
    } catch (e) {
        console.error(id, e);
    }
}

function getFormName(id) {
    switch (id) {
        case 1131:
            return 'Ash-Greninja'
        case 1174:
            return 'Meowstic-F'
        case 1199:
            return 'Rockruff Own-Tempo'
        case 1330:
            return 'Indeedee-F'
        case 1343:
            return 'Basculegion-F'
        default:
            return formNames.labelDataArray[id].wordDataArray[0].str;
    }
}

function getItemString(itemId) {
    return itemNameData.labelDataArray[itemId].wordDataArray[0].str;
}

function getAbilityString(abiltiyId) {
    const abilityString = AbilityNameData.labelDataArray[abiltiyId].wordDataArray[0].str;
    if (!abilityString) {
        console.warn(abilityString, abiltiyId);
    }
    return abilityString;
}

function getNatureName(natureId) {
    return natureNameData.labelDataArray[natureId].wordDataArray[0].str;
}

function isSmogonCompatible(str) {
    for (let gen of SMOGON_MOVES) {
        if (Object.keys(gen).includes(str)) {
            return true;
        }
    }

    return false;
}

const data = pokemonData.Personal.reduce((pkmn, e, i) => {
    if (i === 0) return pkmn;

    const formIndex = e.form_index;
    if (formIndex === 0 || e.id === e.monsno) {
        const name = getPokemonName(e.monsno);
        pkmn[name] = {};
        pkmn[name].types = getTypes(e);
        pkmn[name].bs = { hp: e.basic_hp, at: e.basic_atk, df: e.basic_def, sa: e.basic_spatk, sd: e.basic_spdef, sp: e.basic_agi }
        pkmn[name].weightkg = e.weight / 10;
        pkmn[name].abilities = makeAbilityObject(e.tokusei3)

        const g = getGender(e.sex);
        if (g) {
            pkmn[name].gender = g;
        }

        return pkmn;
    }

    const name = getPokemonName(e.monsno);
    const formName = getFormName(i);

    if (!formName) {
        console.warn('Form Error:', i, formName,Name);
    }
    if (!pkmn[name].hasOwnProperty('otherFormes')) {
        pkmn[name].otherFormes = [];
    }
    pkmn[name].otherFormes.push(formName);
    pkmn[formName] = {}
    pkmn[formName].types = getTypes(e);
    pkmn[formName].bs = { hp: e.basic_hp, at: e.basic_atk, df: e.basic_def, sa: e.basic_spatk, sd: e.basic_spdef, sp: e.basic_agi }
    pkmn[formName].weightkg = e.weight / 10;
    pkmn[formName].abilities = makeAbilityObject(e.tokusei3)
    const g = getGender(e.sex);
    if (g) {
        pkmn[formName].gender = g;
    }
    pkmn[formName].baseSpecies = name;
    return pkmn;
}, {})

function getMoveString(id = 0) {
    const str = moveEnum[id];
    if (!isSmogonCompatible(str)) {
        throw Error(`Incompatible move string found: ID - ${id}, String: ${str}`)
    }

    return str;
}

function generateMovesViaLearnset(monsNo, level) {
    const idx = learnset.WazaOboe[monsNo].ar.findIndex((e, i) => {
        if (i % 2 === 1) return;
        return e > level;
    })

    const moves = learnset.WazaOboe[monsNo].ar.slice(0, idx);

    return [
        getMoveString(moves.at(-7)),
        getMoveString(moves.at(-5)),
        getMoveString(moves.at(-3)),
        getMoveString(moves.at(-1)),
    ]
}

function getMoves(m1, m2, m3, m4, monsno, level) {
    if (m1 === m2 && m1 === m3 && m1 === m4) {
        return generateMovesViaLearnset(monsno, level);
    }

    const moves = [
        moveEnum[m1],
        moveEnum[m2],
        moveEnum[m3],
        moveEnum[m4]
    ]

    if (moves[0] === null) {
        console.warn('Moves:', m1, m2, m3, m4, monsno, JSON.stringify(moves));
    }
    return moves;
}


function getGender(sex) {
    if (sex === 0) return 'M';
    if (sex === 254) return 'F';
    if (sex === 255) return 'N';
    return null;
}

function getTrainerLabel(labelName) {
    return trainerLabels.labelDataArray.find(e => e.labelName === labelName)?.wordDataArray[0].str;
}

function getTrainerName(labelName) {
    return trainerNames.labelDataArray.find(e => e.labelName === labelName)?.wordDataArray[0].str;
}

function getTrainerDataFromPlaceDatas() {
    let trainers = [];
    for (let i = 0; i < bdspLocationFiles.length; i++) {
        const data = require('./PlaceDatas/' + bdspLocationFiles[i])
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

const BDSPTrainers = getTrainerDataFromPlaceDatas()
const missingBDSPTrainers = TRAINER_TABLE.TrainerPoke.filter(trainer => {
    return !BDSPTrainers.includes(t => t.trainerId === trainer.ID)
}).filter(trainer => trainer.ID !== 0)


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

const sets = require('./output/sets.json');

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
    let p1FormName = partyData.P1FormNo > 0 ? data[p1Name].otherFormes[partyData.P1FormNo - 1] : null;
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
    let p2FormName = partyData.P2FormNo > 0 ? data[p2monName].otherFormes[partyData.P2FormNo - 1] : null;
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
    let p3FormName = partyData.P3FormNo > 0 ? data[p3monName].otherFormes[partyData.P3FormNo - 1] : null;
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
    let p4FormName = partyData.P4FormNo > 0 ? data[p4monName].otherFormes[partyData.P4FormNo - 1] : null;
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
    let p5FormName = partyData.P5FormNo > 0 ? data[p5monName].otherFormes[partyData.P5FormNo - 1] : null;
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
    let p6FormName = partyData.P6FormNo > 0 ? data[p6monName].otherFormes[partyData.P6FormNo - 1] : null;
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

const {volkners, missingTrainers} = findMissingTrainers(BDSPTrainers);
const filepath = path.join(__dirname, 'output')
fs.writeFileSync(path.join(filepath, 'missingTrainers.json'), JSON.stringify(missingTrainers), 'utf-8');
fs.writeFileSync(path.join(filepath, 'trainerSets.json'), JSON.stringify(sets, null, 2), 'utf-8');

module.exports = function(){
    //Overwrite the gen8 js file
    fs.writeFileSync(
        path.join(__dirname, 'src', 'js', 'data', 'sets', 'gen8.js'),  
        `var SETDEX_SS = ${JSON.stringify({ ...sets })}`,
        'utf-8'
    );
}