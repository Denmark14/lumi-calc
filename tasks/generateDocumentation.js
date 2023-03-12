const fs = require('fs');
const path = require('path');
const parentFilePath = path.resolve(__dirname, '..');
const {getTypeName, getFormName} = require('./pokemonUtils');
const pokemonInfo = require('../input/PersonalTable.json');
const pokemonNames = require('../input/english_ss_monsname.json');
const pokemonFormNames = require('../input/english_ss_zkn_form.json');
const moveFile = require('../input/WazaTable.json');
const moveNames = require('../input/english_ss_wazaname.json');
const itemNames = require('../input/english_ss_itemname.json');
const itemTable = require('../input/ItemTable.json');

if(!fs.existsSync(path.join(parentFilePath, 'output'))) {
    fs.mkdirSync(path.join(parentFilePath, 'output'));
}

function createMoveElement(moveName) {
    return `$F11="${moveName}",`;
}

function createPokemonElement(pokemonName) {
    return `$C5="${pokemonName}",`;
}

const MOVE_DICTIONARY = new Array(17);
const POKEMON_DICTIONARY = new Array(17);

for(let currentMove of moveFile.Waza) {
    const {wazaNo, type} = currentMove;
    if(wazaNo === 237 || wazaNo === 0) continue;//Ignore normal hidden power

    if(!MOVE_DICTIONARY[type]) {
        MOVE_DICTIONARY[type] = [
            createMoveElement(`Hidden Power (${getTypeName(type)})`)
        ];
    }

    const moveName = moveNames.labelDataArray[wazaNo].wordDataArray[0].str;
    MOVE_DICTIONARY[type].push(createMoveElement(moveName));
}

function createMoveList(moveArray) {
    const header = `=OR(`;
    const footer = `)`;
    const moveList = moveArray.join('');
    return header + moveList.substring(0, moveList.length - 1) + footer;
}

function createMoveTextFile(moveDictionary) {
    let textString = '';
    for(let i = 0; i < moveDictionary.length; i++) {
        textString += `[${getTypeName(i)}]\n\n`
        textString += createMoveList(moveDictionary[i]);
        textString += '\n\n';
    }

    writeFile('GoogleDoc_Move_List.txt', textString)
}

createMoveTextFile(MOVE_DICTIONARY);

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

for(let currentPersonal of pokemonInfo.Personal) {
    const {id, monsno, type1} = currentPersonal;
    if(id === 0) continue;
    const pokemonName = getPokemonName(id, monsno, type1);

    if(!POKEMON_DICTIONARY[type1]) {
        POKEMON_DICTIONARY[type1] = [];
    }

    if(!pokemonName) {
        console.info(id, monsno, type1, pokemonName);
        throw Error()
    };
    POKEMON_DICTIONARY[type1].push(createPokemonElement(pokemonName));
}

function createPokemonTextFile(pokeDict) {
    let textString = '';
    for(let i = 0; i < pokeDict.length; i++) {
        textString += `[${getTypeName(i)}]\n\n`
        textString += createMoveList(pokeDict[i]);
        textString += '\n\n';
    }

    writeFile('GoogleDoc_Pokemon_List.txt', textString);
}

createPokemonTextFile(POKEMON_DICTIONARY);

let itemString = '';
for(let currentItem of itemTable.Item) {
    if(currentItem.no === 0 || currentItem.iconid === -1) continue;
    const itemName = itemNames.labelDataArray[currentItem.no].wordDataArray[0]?.str;
    if(!itemName) {
        console.info(currentItem.no);
    }
    itemString += itemName;
    itemString += '\n'
}

writeFile('GoogleDoc_Item_List.txt', itemString);

function writeFile(filename, data) {
    fs.writeFileSync(path.join(parentFilePath, 'output', filename), data, 'utf-8');
}