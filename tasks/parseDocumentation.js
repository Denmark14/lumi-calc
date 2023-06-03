const fs = require('fs');
const path = require('path')
const trainerData = require('../input/TrainerTable.json');
const parentFilePath = path.resolve(__dirname, '..');
const rawDocumentFile = fs.readFileSync(path.join(parentFilePath, 'input', 'docs.csv'), 'utf-8');
const {generateTrainerName} = require('./trainerUtils');
const { 
    getAbilityIdFromAbilityName,
    getAbilityString,
    getPokemonName,
    getPokemonMonsNoFromName,
    getNatureId,
    getNatureName,
    getItemIdFromItemName,
    getItemString,
    getMoves,
    getMoveId,
    getMoveString,
    generateMovesViaLearnset,
    getFormNameFromDocumentation
} = require('./pokemonUtils');

if(!fs.existsSync(path.join(parentFilePath, 'output'))) {
    fs.mkdirSync(path.join(parentFilePath, 'output'));
}

require('./createLumiMons')();

if(!fs.existsSync(path.join(parentFilePath, 'output', 'missingTrainers.json'))) {
    require('./createMissingTrainers')();
}

const speciesData = require(path.join(parentFilePath, 'output', 'LumiMons.json'));
const missingTrainers = require(path.join(parentFilePath, 'output', 'missingTrainers.json'));

const docSets = [];
const trainerDocs = [];
const partyMatchups = [];
const abilityMatchups = [];
const moveMatchups = [];
const itemMatchups = [];
const natureMatchups = [];
const ivMatchups = [];
const evMatchups = [];

const badDocs = [];
const badGameData = [];
const evChangelog = [];

function stripTypeFromHiddenPower(str) {
    const i = str.indexOf('(');
    return str.substring(0, i).trim();
}

function generateDocPokemonObject(documentName, documentLevel, documentNature, documentAbility, documentItemName, documentMove1, documentMove2, documentMove3, documentMove4, ivs, evs, id, pNum) {

    let documentMonsNo = getPokemonMonsNoFromName(documentName);
    if (!documentName || !documentLevel || isNaN(parseInt(documentLevel))) return;

    if (documentMonsNo === -1) {
        documentMonsNo = getFormNameFromDocumentation(documentName);
        if(documentMonsNo === -1) return console.error(`Unhandled MonsNo: ${documentMonsNo}, ${documentName}, ${id}`);
    }

    const documentAbilityId = getAbilityIdFromAbilityName(documentAbility);
    const trainerPokeData = trainerData.TrainerPoke[id];

    if (trainerPokeData === undefined) {
        console.warn(`Invalid Trainer ID: ${id}`);
        throw new Error(`${documentName || 'undefined'} - ${id || 'undefined'}`);
    }

    const propName = `P${pNum}`;
    const gameMonsNo = trainerPokeData[`${propName}MonsNo`]
    const gameMonsName = getPokemonName(gameMonsNo);
    const gameMonLevel = trainerPokeData[`${propName}Level`];
    
    if (gameMonsNo !== documentMonsNo) {
        partyMatchups.push(`Bad party matchup:\n\tParty ID: ${id}\n\tParty Slot ${pNum}\n\tDocs: ${documentName}\n\tGame: ${gameMonsName}`)
        return;
    }

    const trainerAbilityId = trainerPokeData[`${propName}Tokusei`];
    const abilityMatch = trainerAbilityId === documentAbilityId;
    if (!abilityMatch) {
        abilityMatchups.push(`Party ID ${id} - ${getPokemonName(documentMonsNo)}\nDocs ability: ${documentAbility || 'undefined'} - ${documentAbilityId}\nGamedata Ability: ${getAbilityString(trainerAbilityId) || 'undefined'} - ${trainerAbilityId}`)
    }

    if (documentMove1.includes('Hidden Power')) {
        documentMove1 = stripTypeFromHiddenPower(documentMove1);
    }
    if (documentMove2.includes('Hidden Power')) {
        documentMove2 = stripTypeFromHiddenPower(documentMove2);
    }
    if (documentMove3.includes('Hidden Power')) {
        documentMove3 = stripTypeFromHiddenPower(documentMove3);
    }
    if (documentMove4.includes('Hidden Power')) {
        documentMove4 = stripTypeFromHiddenPower(documentMove4);
    }

    const docSet = {
        level: documentLevel,
        ability: documentAbility,
        nature: documentNature,
        moves: getMoves(
            getMoveId(documentMove1),
            getMoveId(documentMove2),
            getMoveId(documentMove3),
            getMoveId(documentMove4),
            documentName,
            documentLevel
        )
    }

    if (documentItemName) {
        docSet['item'] = documentItemName;
    }

    const docMove1Id = getMoveId(docSet.moves[0]);
    const docMove2Id = getMoveId(docSet.moves[1]);
    const docMove3Id = getMoveId(docSet.moves[2]);
    const docMove4Id = getMoveId(docSet.moves[3]);

    let generatedFromLearnset = false;
    let [gameMove1Id, gameMove2Id, gameMove3Id, gameMove4Id] = [
        trainerPokeData[`${propName}Waza1`],
        trainerPokeData[`${propName}Waza2`],
        trainerPokeData[`${propName}Waza3`],
        trainerPokeData[`${propName}Waza4`],
    ];

    
    if (gameMove1Id === 0 && gameMove2Id === 0 && gameMove3Id === 0 && gameMove4Id === 0) {
        const moveNames = generateMovesViaLearnset(gameMonsNo, gameMonLevel);
        [gameMove1Id, gameMove2Id, gameMove3Id, gameMove4Id] = [getMoveId(moveNames[0]), getMoveId(moveNames[1]), getMoveId(moveNames[2]), getMoveId(moveNames[3])];
        generatedFromLearnset = true;
    }


    if (![gameMove1Id, gameMove2Id, gameMove3Id, gameMove4Id].includes(docMove1Id)) {
        moveMatchups.push(`Bad move matchup:\n\tParty ID: ${id}\n\tParty Slot ${pNum} - ${documentName}\n\tMove Slot: ${1}\n\tDocs: ${documentMove1} - ${docMove1Id}\n\tGame: ${getMoveString(gameMove1Id)} - ${gameMove1Id}${generatedFromLearnset ? ' - Generated via learnset' : ''}`)
    }
    if (![gameMove1Id, gameMove2Id, gameMove3Id, gameMove4Id].includes(docMove2Id)) {
        moveMatchups.push(`Bad move matchup:\n\tParty ID: ${id}\n\tParty Slot ${pNum} - ${documentName}\n\tMove Slot: ${2}\n\tDocs: ${documentMove2} - ${docMove2Id}\n\tGame: ${getMoveString(gameMove2Id)} - ${gameMove2Id}${generatedFromLearnset ? ' - Generated via learnset' : ''}`)
    }
    if (![gameMove1Id, gameMove2Id, gameMove3Id, gameMove4Id].includes(docMove3Id)) {
        moveMatchups.push(`Bad move matchup:\n\tParty ID: ${id}\n\tParty Slot ${pNum} - ${documentName}\n\tMove Slot: ${3}\n\tDocs: ${documentMove3} - ${docMove3Id}\n\tGame: ${getMoveString(gameMove3Id)} - ${gameMove3Id}${generatedFromLearnset ? ' - Generated via learnset' : ''}`)
    }
    if (![gameMove1Id, gameMove2Id, gameMove3Id, gameMove4Id].includes(docMove4Id)) {
        moveMatchups.push(`Bad move matchup:\n\tParty ID: ${id}\n\tParty Slot ${pNum} - ${documentName}\n\tMove Slot: ${4}\n\tDocs: ${documentMove4} - ${docMove4Id}\n\tGame: ${getMoveString(gameMove4Id)} - ${gameMove4Id}${generatedFromLearnset ? ' - Generated via learnset' : ''}`)
    }

    if (documentItemName) {
        const docItemName = documentItemName.replaceAll('\'', '’');//Kings rock hack
        const gameItemId = trainerPokeData[`${propName}Item`];
        const itemId = getItemIdFromItemName(docItemName);
        if (itemId === -1 || (itemId !== gameItemId)) {
            itemMatchups.push(`Bad Item Matchup:\n\tParty: ${id}\n\tParty Slot:${pNum}\n\tDoc Data: ${docItemName} - ${itemId}\n\tGame Data: ${getItemString(gameItemId)} - ${gameItemId}`);
        }
    }

    const docNatureId = getNatureId(documentNature);
    const gameNatureId = trainerPokeData[`${propName}Seikaku`];
    if (docNatureId === -1 || docNatureId !== gameNatureId) {
        const docNatureString = getNatureName(docNatureId);
        const gameNatureString = getNatureName(gameNatureId);
        natureMatchups.push(`Bad Nature Matchup:\n\tParty: ${id}\n\tParty Slot:${pNum}\n\tDoc Data: ${docNatureString} - ${docNatureId}\n\tGame Data: ${gameNatureString} - ${gameNatureId}`);
    }

    //{hp: iv, at: iv, df: iv, sa: iv, sd: iv, sp: iv};
    docSet.ivs = {
        hp: parseInt(trainerPokeData[`${propName}TalentHp`]),
        at: parseInt(trainerPokeData[`${propName}TalentAtk`]),
        df: parseInt(trainerPokeData[`${propName}TalentDef`]),
        sa: parseInt(trainerPokeData[`${propName}TalentSpAtk`]),
        sd: parseInt(trainerPokeData[`${propName}TalentSpDef`]),
        sp: parseInt(trainerPokeData[`${propName}TalentAgi`])
    }

    docSet.evs = {
        hp: parseInt(trainerPokeData[`${propName}EffortHp`]),
        at: parseInt(trainerPokeData[`${propName}EffortAtk`]),
        df: parseInt(trainerPokeData[`${propName}EffortDef`]),
        sa: parseInt(trainerPokeData[`${propName}EffortSpAtk`]),
        sd: parseInt(trainerPokeData[`${propName}EffortSpDef`]),
        sp: parseInt(trainerPokeData[`${propName}EffortAgi`])
    }


    docSets.push(docSet);
    return docSet;
}

rawDocumentFile.split('\n').forEach((line, i) => {
    if (line > 3) return;
    const [
        trainerID, rawTrainerName, LevelCap, format,
        //P1
        pokemon1Icon, Pokemon1Name, Pokemon1Level,
    ] = line.split(',').map(x => x.trim());

    const trainerName = generateTrainerName(rawTrainerName, Pokemon1Level);

    const party = {};
    if (trainerID && !isNaN(parseInt(trainerID))) {

        const missingTrainerIdx = missingTrainers.findIndex(e => e.trainerId == trainerID);
        if(missingTrainerIdx !== -1) {
            missingTrainers.splice(missingTrainerIdx, 1);
        }

        const p1 = generatePokemonObject(parseInt(trainerID), 1);
        const p2 = generatePokemonObject(parseInt(trainerID), 2);
        const p3 = generatePokemonObject(parseInt(trainerID), 3);
        const p4 = generatePokemonObject(parseInt(trainerID), 4);
        const p5 = generatePokemonObject(parseInt(trainerID), 5);
        const p6 = generatePokemonObject(parseInt(trainerID), 6);

        if (p1 !== undefined) party.p1 = p1;
        if (p2 !== undefined) party.p2 = p2;
        if (p3 !== undefined) party.p3 = p3;
        if (p4 !== undefined) party.p4 = p4;
        if (p5 !== undefined) party.p5 = p5;
        if (p6 !== undefined) party.p6 = p6;
    }


    if (!trainerID || isNaN(parseInt(trainerID))) {
        return;
    }

    trainerDocs.push({
        id: trainerID,
        name: trainerName,
        party
    })
})

function generatePokemonObject(trainerId, partyNo) {
    const tr = trainerData.TrainerPoke[trainerId];
    return {
        level: tr[`P${partyNo}Level`],
        ability: tr[`P${partyNo}Tokusei`],
        nature: tr[`P${partyNo}Seikaku`],
        moves: getMoves(
            tr[`P${partyNo}Waza1`],
            tr[`P${partyNo}Waza2`],
            tr[`P${partyNo}Waza3`],
            tr[`P${partyNo}Waza4`],
            tr[`P${partyNo}MonsNo`],
            tr[`P${partyNo}Level`]
        )
    }
}


const sets = {}

trainerDocs.forEach((e, i) => {
    const partyData = trainerData.TrainerPoke[e.id];
    if (!partyData.P1MonsNo) return;
    const p1Name = getPokemonName(partyData.P1MonsNo);
    let p1FormName = partyData.P1FormNo > 0 ? speciesData[p1Name].otherFormes[partyData.P1FormNo - 1] : null;
    const p1MonName = p1FormName ?? p1Name;
    if (sets[p1MonName] === undefined) {
        sets[p1MonName] = {};
    }

    sets[p1MonName][e.name] = {
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
        sets[p1MonName][e.name].item = getItemString(partyData.P1Item);
    }

    if (!partyData.P2MonsNo) return;

    const p2monName = getPokemonName(partyData.P2MonsNo);
    let p2FormName = partyData.P2FormNo > 0 ? speciesData[p2monName].otherFormes[partyData.P2FormNo - 1] : null;
    const p2name = p2FormName ?? p2monName;
    if (sets[p2name] === undefined) {
        sets[p2name] = {};
    }

    sets[p2name][e.name] = {
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
        sets[p2name][e.name].item = getItemString(partyData.P2Item);
    }

    if (!partyData.P3MonsNo) return;

    const p3monName = getPokemonName(partyData.P3MonsNo);
    let p3FormName = partyData.P3FormNo > 0 ? speciesData[p3monName].otherFormes[partyData.P3FormNo - 1] : null;
    const p3name = p3FormName ?? p3monName;

    if (sets[p3name] === undefined) {
        sets[p3name] = {};
    }

    sets[p3name][e.name] = {
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
        sets[p3name][e.name].item = getItemString(partyData.P3Item);
    }

    if (!partyData.P4MonsNo) return;

    const p4monName = getPokemonName(partyData.P4MonsNo);
    let p4FormName = partyData.P4FormNo > 0 ? speciesData[p4monName].otherFormes[partyData.P4FormNo - 1] : null;
    const p4name = p4FormName ?? p4monName;

    if (sets[p4name] === undefined) {
        sets[p4name] = {};
    }

    sets[p4name][e.name] = {
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
        sets[p4name][e.name].item = getItemString(partyData.P4Item);
    }

    if (!partyData.P5MonsNo) return;
    const p5monName = getPokemonName(partyData.P5MonsNo);
    let p5FormName = partyData.P5FormNo > 0 ? speciesData[p5monName].otherFormes[partyData.P5FormNo - 1] : null;
    const p5name = p5FormName ?? p5monName;

    if (sets[p5name] === undefined) {
        sets[p5name] = {};
    }

    sets[p5name][e.name] = {
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
        sets[p5name][e.name].item = getItemString(partyData.P5Item);
    }

    if (!partyData.P6MonsNo) return;
    const p6monName = getPokemonName(partyData.P6MonsNo);
    let p6FormName = partyData.P6FormNo > 0 ? speciesData[p6monName].otherFormes[partyData.P6FormNo - 1] : null;
    const p6name = p6FormName ?? p6monName;

    if (sets[p6name] === undefined) {
        sets[p6name] = {};
    }

    sets[p6name][e.name] = {
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
        sets[p6name][e.name].item = getItemString(partyData.P6Item);
    }
})

const filepath = path.join(parentFilePath, 'output');

//Documentation
fs.writeFileSync(path.join(filepath, 'bad_abilities.txt'), abilityMatchups.join('\n'), 'utf-8')
fs.writeFileSync(path.join(filepath, 'bad_parties.txt'), partyMatchups.join('\n'), 'utf-8')
fs.writeFileSync(path.join(filepath, 'bad_moves.txt'), moveMatchups.join('\n'), 'utf-8')
fs.writeFileSync(path.join(filepath, 'bad_items.txt'), itemMatchups.join('\n'), 'utf-8')
fs.writeFileSync(path.join(filepath,'bad_natures.txt'), natureMatchups.join('\n'), 'utf-8')
fs.writeFileSync(path.join(filepath, 'bad_evs.txt'), evMatchups.join('\n'), 'utf-8')
fs.writeFileSync(path.join(filepath,'bad_ivs.txt'), ivMatchups.join('\n'), 'utf-8')
fs.writeFileSync(path.join(filepath, 'bad_docs.txt'), 'Modified game data was taken as true.\n\n' + badDocs.join('\n'), 'utf-8')
fs.writeFileSync(path.join(filepath, 'bad_gamedata.txt'), 'Doc data was taken as true.\n\n' + badGameData.join('\n'), 'utf-8')
fs.writeFileSync(path.join(filepath, 'ev_changelog.txt'), evChangelog.join('\n'), 'utf-8')

//Data files
fs.writeFileSync(path.join(filepath, 'sets.json'), JSON.stringify({ ...sets }), 'utf-8')
fs.writeFileSync(path.join(filepath, 'missingTrainers.json'), JSON.stringify(missingTrainers), 'utf-8')