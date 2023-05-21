const fs = require('fs');
const path = require('path');
const parentFilePath = path.resolve(__dirname, '..');
const {getTypeName, getFormName, FORM_MAP, getNatureName, getAbilityString, getMoveString, getItemString, generateMovesViaLearnset} = require('./pokemonUtils');
const PersonalTable = require('../input/PersonalTable.json');
const pokemonNames = require('../input/english_ss_monsname.json');
const pokemonFormNames = require('../input/english_ss_zkn_form.json');
const TrainerTable = require('../input/TrainerTable.json');
const trainerNameData = require('../input/english_dp_trainers_name.json');
const trainerClassData = require('../input/english_dp_trainers_type.json');
const rawDocumentFile = fs.readFileSync(path.join(parentFilePath, 'input', 'docs.csv'), 'utf-8');
const EMPTY_IMAGE_SECTION = '';

const documentationTrainers = rawDocumentFile.split('\n').map((line, i) => {
    if (line > 3) return;
    const [
        trainerID, rawTrainerName, LevelCap, format
    ] = line.split(',').map(x => x.trim());

    return [trainerID, rawTrainerName, LevelCap, format];
});

if(!fs.existsSync(path.join(parentFilePath, 'output'))) {
    fs.mkdirSync(path.join(parentFilePath, 'output'));
}

let section = [];

for(let docTrainer of documentationTrainers) {
    const [rawTrainerId, rawTrainerName, LevelCap, format] = docTrainer;
    const trainerId = parseInt(rawTrainerId);
    if(!rawTrainerId || isNaN(trainerId)) continue;
    section.push(trainerId);
    section.push(rawTrainerName.trim());
    section.push(LevelCap)
    section.push(format)
    const trainerParty = TrainerTable.TrainerPoke[trainerId];
    for(let i = 1; i <= 6; i++) {
        const monsno = trainerParty[`P${i}MonsNo`];
        if(monsno === 0) break;
        section.push(EMPTY_IMAGE_SECTION);
        
        const pokemonId = FORM_MAP[monsno][trainerParty[`P${i}FormNo`]];
        const pokemonType = getTypeName(PersonalTable.Personal[pokemonId].type1);
        const pokemonName = getPokemonName(pokemonId, monsno, pokemonType);
        const pokemonLevel = trainerParty[`P${i}Level`];
        const pokemonNature = getNatureName(trainerParty[`P${i}Seikaku`]);
        const pokemonAbility = getAbilityString(trainerParty[`P${i}Tokusei`]);
        const pokemonItem = getItemString(trainerParty[`P${i}Item`]);
        let move1 = getMoveString(trainerParty[`P${i}Waza1`]);
        let move2 = getMoveString(trainerParty[`P${i}Waza2`]);
        let move3 = getMoveString(trainerParty[`P${i}Waza3`]);
        let move4 = getMoveString(trainerParty[`P${i}Waza4`]);

        if(move1 === '(No Move)' && move2 === '(No Move)' && move3 === '(No Move)' && move4 === '(No Move)') {
            [move1, move2, move3, move4] = generateMovesViaLearnset(pokemonId, pokemonLevel);
        }

        const pokemonIvs = {
           hp: trainerParty[`P${i}TalentHp`],
           at: trainerParty[`P${i}TalentAtk`],
           df: trainerParty[`P${i}TalentDef`],
           sa: trainerParty[`P${i}TalentSpAtk`],
           sd: trainerParty[`P${i}TalentSpDef`],
           sp: trainerParty[`P${i}TalentAgi`]
        }

        const prettyIvs = prettifyIvs(pokemonIvs);
        const pokemonEvs = {
           hp: trainerParty[`P${i}EffortHp`],
           at: trainerParty[`P${i}EffortAtk`],
           df: trainerParty[`P${i}EffortDef`],
           sa: trainerParty[`P${i}EffortSpAtk`],
           sd: trainerParty[`P${i}EffortSpDef`],
           sp: trainerParty[`P${i}EffortAgi`]
        }

        const prettyEvs = prettifyEvs(pokemonEvs);
        section.push(EMPTY_IMAGE_SECTION);
        section.push(pokemonName);
        section.push(pokemonLevel);
        section.push(pokemonNature);
        section.push(pokemonAbility);
        section.push(EMPTY_IMAGE_SECTION);
        section.push(pokemonItem);
        section.push(move1);
        section.push(move2);
        section.push(move3);
        section.push(move4);
        section.push(prettyIvs);
        section.push(prettyEvs);
    }

    section.push('\n\n');
}

const gameTrainerDocs = [];
for(let idx = 1; idx < TrainerTable.TrainerPoke.length; idx++) {
    const trainerParty = TrainerTable.TrainerPoke[idx];
    if(trainerParty.P1MonsNo === 0) continue;

    const section = [];
    section.push(trainerParty.ID);

    const trainerNameLabel = TrainerTable.TrainerData[idx].NameLabel;
    const trainerType = TrainerTable.TrainerData[idx].TypeID;
    const trainerClassLabel = TrainerTable.TrainerType[trainerType].LabelTrType;
    section.push('LevelCap')
    section.push('Format: Singles')
    //console.log(trainerNameLabel)
    const trainerName = trainerNameData.labelDataArray.find(e => e.labelName === trainerNameLabel).wordDataArray[0].str;
    //console.log(trainerClassLabel)
    if(trainerClassLabel.length < 3) {
        console.log(idx, trainerNameLabel, trainerType);
    }
    const trainerClass = trainerClassData.labelDataArray.find(e => e.labelName === trainerClassLabel).wordDataArray[0].str;
    section.push(`${trainerClass} ${trainerName}`);
    for(let i = 1; i <= 6; i++) {
        const monsno = trainerParty[`P${i}MonsNo`];
        if(monsno === 0) break;
        const pokemonId = FORM_MAP[monsno][trainerParty[`P${i}FormNo`]];
        const pokemonType = getTypeName(PersonalTable.Personal[pokemonId].type1);
        const pokemonName = getPokemonName(pokemonId, monsno, pokemonType);
        const pokemonLevel = trainerParty[`P${i}Level`];
        const pokemonNature = getNatureName(trainerParty[`P${i}Seikaku`]);
        const pokemonAbility = getAbilityString(trainerParty[`P${i}Tokusei`]);
        const pokemonItem = getItemString(trainerParty[`P${i}Item`]);
        let move1 = getMoveString(trainerParty[`P${i}Waza1`]);
        let move2 = getMoveString(trainerParty[`P${i}Waza2`]);
        let move3 = getMoveString(trainerParty[`P${i}Waza3`]);
        let move4 = getMoveString(trainerParty[`P${i}Waza4`]);

        if(move1 === '(No Move)' && move2 === '(No Move)' && move3 === '(No Move)' && move4 === '(No Move)') {
            [move1, move2, move3, move4] = generateMovesViaLearnset(pokemonId, pokemonLevel);
        }

        const pokemonIvs = {
           hp: trainerParty[`P${i}TalentHp`],
           at: trainerParty[`P${i}TalentAtk`],
           df: trainerParty[`P${i}TalentDef`],
           sa: trainerParty[`P${i}TalentSpAtk`],
           sd: trainerParty[`P${i}TalentSpDef`],
           sp: trainerParty[`P${i}TalentAgi`]
        }

        const prettyIvs = prettifyIvs(pokemonIvs);
        const pokemonEvs = {
           hp: trainerParty[`P${i}EffortHp`],
           at: trainerParty[`P${i}EffortAtk`],
           df: trainerParty[`P${i}EffortDef`],
           sa: trainerParty[`P${i}EffortSpAtk`],
           sd: trainerParty[`P${i}EffortSpDef`],
           sp: trainerParty[`P${i}EffortAgi`]
        }

        const prettyEvs = prettifyEvs(pokemonEvs);
        section.push('\n')
        section.push(pokemonName);
        section.push(pokemonLevel);
        section.push(pokemonNature);
        section.push(pokemonAbility);
        section.push(EMPTY_IMAGE_SECTION);
        section.push(pokemonItem);
        section.push(move1);
        section.push(move2);
        section.push(move3);
        section.push(move4);
        section.push(prettyIvs);
        section.push(prettyEvs);
    }

    gameTrainerDocs.push(section.join('\n'));
}

fs.writeFileSync('gameTrainerDocs.txt', gameTrainerDocs.join('\n\n'), 'utf-8');
fs.writeFileSync('trainerDocs.txt', section.join('\n'), 'utf-8');

function getPokemonName(id, monsno, type) {
    try {
        let name = null;
        if(id !== monsno) {
            name = pokemonFormNames.labelDataArray[id].wordDataArray[0].str;
            if(name === pokemonNames.labelDataArray[monsno].wordDataArray[0].str) {
                name += ` (${getTypeName(type)})`;
            }
        } else {
            name = pokemonNames.labelDataArray[id].wordDataArray[0].str;
        }

        return name || getFormName(id);
    } catch(e) {
        console.info(`getPokemonName`, id, monsno);
    }
}

/**
 * 
 * @param {{hp: number, at: number, df: number, sa: number, sd: number, sp: number}} evs 
 */
function prettifyEvs(evs) {
    const varyingAmount = Object.values(evs).filter(e => e !== 0).length;
    if(varyingAmount === 0) return 'None';
    if(varyingAmount < 4) return textualEvs(evs);
    return simpleEvs(evs);
}

/**
 * 
 * @param {{hp: number, at: number, df: number, sa: number, sd: number, sp: number}} evs 
 */
function textualEvs(evs) {
    let res = '';
    for(let [key, value] of Object.entries(evs)) {
        if(value === 0) continue;
        res += `${value} ${getValueName(key)} / `
    }
    if(res.length === 0) throw Error(JSON.stringify(evs));
    return res.slice(0, res.length - 3);
}

function simpleEvs(evs) {
    let res = '';
    for(let [key, value] of Object.entries(evs)) {
        res += `${value}/`
    }
    return res.slice(0, res.length - 1);
}

function getValueName(str) {
    switch(str) {
        case 'hp':
            return 'HP';
        case 'at':
            return 'Atk'
        case 'df':
            return 'Def'
        case 'sa':
            return 'SpA'
        case 'sd':
            return 'SpD'
        case 'sp':
            return 'Spe'
        default:
            throw Error(`Bad Value Name: ${str}`);
    }
}

/**
 * 
 * @param {{hp: number, at: number, df: number, sa: number, sd: number, sp: number}} evs 
 */
function prettifyIvs(ivs) {
    if(Object.values(ivs).every(e => e === ivs.hp)) return `All ${ivs.hp}`;
    const hasOneDifferent = hasOneDifferentValue(ivs);
    const differentKey = getKeyOfDifferentValue(ivs);
    if(hasOneDifferent) return `All ${differentKey !== 'hp' ? ivs.hp : ivs.at}, 0 ${getValueName(differentKey)}`
    return Object.values(ivs).reduce((acc, curr) => acc + `${curr}/`, '').slice(0, -1);
}

function hasOneDifferentValue(obj) {
    let valueArray = Object.values(obj);
    let firstValue = valueArray[0];
    let differentValue = null;
    for (let i = 1; i < valueArray.length; i++) {
      if (valueArray[i] !== firstValue) {
        if (differentValue === null) {
          differentValue = valueArray[i];
        } else {
          return false;
        }
      }
    }
    return differentValue !== null;
  }

  function getKeyOfDifferentValue(obj) {
    let valueArray = Object.values(obj);
    let firstValue = valueArray[0];
    let differentValue = null;
    let differentValueIndex = -1;
    for (let i = 1; i < valueArray.length; i++) {
      if (valueArray[i] !== firstValue) {
        if (differentValue === null) {
          differentValue = valueArray[i];
          differentValueIndex = i;
        } else {
          return null;
        }
      }
    }
    return differentValue !== null ? Object.keys(obj)[differentValueIndex] : null;
  }
  