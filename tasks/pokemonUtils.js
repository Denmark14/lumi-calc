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
const PersonalTable = require('../input/PersonalTable.json')
const learnset = require('../input/WazaOboeTable.json');
const moveEnum = fs.readFileSync(path.join(parentFilePath, 'input', 'moves.txt'), 'utf-8').split('\n').map(e => e.trim()).filter(e => e);

const FORM_MAP = PersonalTable.Personal.reduce((acc, curr) => {
    if (!Array.isArray(acc[curr.monsno])) {
        acc[curr.monsno] = [];
    }

    acc[curr.monsno].push(curr.id);
    return acc;
}, {})

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

function getPokemonName(monsNo = 0) {
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
        case 1242:
            return 'Ash-Greninja'
        case 1285:
            return 'Meowstic-F'
        case 1310:
            return 'Rockruff Own-Tempo'
        case 1441:
            return 'Indeedee-F'
        case 1454:
            return 'Basculegion-F'
        case 1456:
            return 'Oinkologne-F'
        default:
            let name = formNames.labelDataArray[id].wordDataArray[0].str;
            const dexNum = parseInt(formNames.labelDataArray[id].labelName.slice(-7, -4));
            
            if (name === "") return getPokemonName(id);
            if (!name.includes(getPokemonName(dexNum))) {
                name = getPokemonName(dexNum) + ' ' + name
            }
            return name
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

function getMoveId(moveName) {
    if (!moveName) return 0;
    const id = moveEnum.findIndex(e => e === moveName.trim());
    if(id === -1) throw Error(`Bad move name: ${moveName}`)
    return id;
}

function getAbilityIdFromAbilityName(abilityString) {
    if (!abilityString) return -1;
    const abilityId = AbilityNameData.labelDataArray.findIndex(e => e.wordDataArray[0].str === abilityString);
    if(abilityId === -1) throw Error(`Bad ability name: ${abilityString}`);
    return abilityId;
}

function getPokemonMonsNoFromName(pokemonName) {
    if(!pokemonName) return -1;
    return NameData.labelDataArray.findIndex(e => e.wordDataArray[0].str === pokemonName);
}

function getNatureId(natureString) {
    if(!natureString) return -1;
    const index = natureNameData.labelDataArray.findIndex(e => e.wordDataArray[0].str === natureString);
    if(index === -1) throw Error(`Bad natureString: ${natureString}`);
    return index;
}

function getItemIdFromItemName(itemName) {
    if(!itemName) return -1;
    if(itemName === "King's Rock") return itemNameData.labelDataArray.findIndex(e => e.wordDataArray[0]?.str === "King’s Rock");
    const index = itemNameData.labelDataArray.findIndex(e => e.wordDataArray[0]?.str === itemName);
    if(index === -1) throw Error(`Bad item name: ${itemName}`);
    return index;
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

function getFormNameFromDocumentation(pokemonName) {
    if(pokemonName.includes("'")) return pokemonName.replace("'", "’")
    if(pokemonName.includes("-")) {
        const [pokemon, form] = pokemonName.split('-');
        const monsno = getPokemonMonsNoFromName(pokemon);
        if(form.includes("Altered") || form.includes('Male') || form.includes('Female')) return monsno;
        const formIds = PersonalTable.Personal.filter(e => e.monsno === monsno).map(p => p.id);
        const names = formIds.map(id => formNames.labelDataArray[id].wordDataArray[0].str);
        const formindex = names.findIndex(f => f.includes(form));
        return getFormName(formIds[formindex]);
    }

    const monsno = getPokemonMonsNoFromName(pokemonName);
    const formIds = PersonalTable.Personal.filter(e => e.monsno === monsno).map(p => p.id);
    const names = formIds.map(id => formNames.labelDataArray[id].wordDataArray[0].str);
    const formindex = names.findIndex(f => f.includes(monsno));
    if(formindex === -1) return getPokemonName(monsno);
    return formIds[formindex];
}

function getPokemonIdFromDocumentation(nameString) {
    let pokemonName = nameString
    if(pokemonName === "Porygon-Z") return NameData.labelDataArray.findIndex(e => e.wordDataArray[0].str === "Porygon-Z");
    if(pokemonName.includes("'")) pokemonName = pokemonName.replace("'", "’")
    if(pokemonName.includes("-")) {
        const [pokemon, form] = pokemonName.split('-');
        const monsno = getPokemonMonsNoFromName(pokemon);
        if(form.includes("Altered") || form.includes('Male') || form.includes('Female')) return monsno;
        const formIds = PersonalTable.Personal.filter(e => e.monsno === monsno).map(p => p.id);
        const names = formIds.map(id => formNames.labelDataArray[id].wordDataArray[0].str);
        const formindex = names.findIndex(f => f.includes(form));
        return formIds[formindex];
    }

    const monsno = getPokemonMonsNoFromName(pokemonName);
    const formIds = PersonalTable.Personal.filter(e => e.monsno === monsno).map(p => p.id);
    const names = formIds.map(id => formNames.labelDataArray[id].wordDataArray[0].str);
    const formindex = names.findIndex(f => f.includes(monsno));
    if(formindex === -1) return monsno;
    return formIds[formindex];
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
    getMoveId,
    getAbilityIdFromAbilityName,
    getPokemonMonsNoFromName,
    getNatureId,
    getItemIdFromItemName,
    getMoves,
    getMoveString,
    generateMovesViaLearnset,
    getGender,
    getFormNameFromDocumentation,
    getPokemonIdFromDocumentation,
    FORM_MAP
}
