const fs = require('fs');
const path = require('path');
const parentFilePath = path.resolve(__dirname, '..');
const NameData = require('../input/english_ss_monsname.json');
const AbilityNameData = require('../input/english_ss_tokusei.json');
const typeNameData = require('../input/english_ss_typename.json');
const formNames = require('../input/english_ss_zkn_form.json');
const natureNameData = require('../input/english_ss_seikaku.json');
const itemNameData = require('../input/english_ss_itemname.json');
const SMOGON_MOVES = require('../input/moves.json');
const learnset = require('../input/WazaOboeTable.json');
const moveEnum = fs.readFileSync(path.join(parentFilePath, 'input', 'moves.txt'), 'utf-8').split('\n').map(e => e.trim()).filter(e => e);

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

function getPokemonName(monsNo) {
    try {
        const pokemonName = NameData.labelDataArray[monsNo].wordDataArray[0].str;
        pokemonName.replace('♀', '-F')
        pokemonName.replace('♂', '-M')
        pokemonName.replace('’', '\u2019')
        return pokemonName;
    } catch (e) {
        console.error(monsNo, e);
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

function getMoveId(moveName) {
    if (!moveName) return 0;
    const id = moveEnum.findIndex(e => e === moveName.trim());
    return id;
}

function getAbilityIdFromAbilityName(abilityString) {
    if (!abilityString) return -1;
    const abilityId = AbilityNameData.labelDataArray.findIndex(e => e.wordDataArray[0].str === abilityString);
    return abilityId;
}

function getPokemonMonsNoFromName(pokemonName) {
    if(!pokemonName) return -1;
    return NameData.labelDataArray.findIndex(e => e.wordDataArray[0].str === pokemonName);
}

function getNatureId(natureString) {
    if(!natureString) return -1;
    return natureNameData.labelDataArray.findIndex(e => e.wordDataArray[0].str === natureString);
}

function getItemIdFromItemName(itemName) {
    if(!itemName) return -1;
    return itemNameData.labelDataArray.findIndex(e => e.wordDataArray[0]?.str === itemName);
}

function getGender(sex) {
    if (sex === 0) return 'M';
    if (sex === 254) return 'F';
    if (sex === 255) return 'N';
    return null;
}

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

module.exports = {
    isSmogonCompatible,
    getNatureName,
    getAbilityString,
    getItemString,
    getFormName,
    getPokemonName,
    makeAbilityObject,
    getTypeName,
    getTypes,
    getFormName,
    getMoveId,
    getAbilityIdFromAbilityName,
    getPokemonMonsNoFromName,
    getNatureId,
    getItemIdFromItemName,
    getMoves,
    getMoveString,
    generateMovesViaLearnset,
    getGender
}