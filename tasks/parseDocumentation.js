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
} = require('./pokemonUtils');

if(!fs.existsSync(path.join(parentFilePath, 'output'))) {
    fs.mkdirSync(path.join(parentFilePath, 'output'));
}

if(!fs.existsSync(path.join(parentFilePath, 'output', 'LumiMons.json'))) {
    require('./createLumiMons')();
}

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

    const documentMonsNo = getPokemonMonsNoFromName(documentName);
    if (!documentName || !documentLevel || isNaN(parseInt(documentLevel))) return;

    if (documentMonsNo === -1) {
        console.error(`Unhandled MonsNo: ${documentMonsNo}, ${documentName}, ${id}`);
        return;
    };

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
        ivs: parseIvs(ivs),
        evs: parseEvs(evs),
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
    if (ivs) {
        const [hp, atk, def, spa, spd, spe] = [
            parseInt(trainerPokeData[`${propName}TalentHp`]),
            parseInt(trainerPokeData[`${propName}TalentAtk`]),
            parseInt(trainerPokeData[`${propName}TalentDef`]),
            parseInt(trainerPokeData[`${propName}TalentSpAtk`]),
            parseInt(trainerPokeData[`${propName}TalentSpDef`]),
            parseInt(trainerPokeData[`${propName}TalentAgi`])
        ]
        if (
            docSet.ivs.hp !== hp ||
            docSet.ivs.at !== atk ||
            docSet.ivs.df !== def ||
            docSet.ivs.sa !== spa ||
            docSet.ivs.sd !== spd ||
            docSet.ivs.sp !== spe
        ) {
            const gameIvs = [hp, atk, def, spa, spd, spe];
            ivMatchups.push(`Bad IV Matchup:\n\tParty: ${id}\n\tParty Slot:${pNum}\n\tDoc Data: ${ivs} - ${prettifyEvs(docSet.ivs)}\n\tGame Data: ${gameIvs.join(', ')}`)
        }
    }

    if (evs) {
        let [hp, atk, def, spa, spd, spe] = [
            parseInt(trainerPokeData[`${propName}EffortHp`]),
            parseInt(trainerPokeData[`${propName}EffortAtk`]),
            parseInt(trainerPokeData[`${propName}EffortDef`]),
            parseInt(trainerPokeData[`${propName}EffortSpAtk`]),
            parseInt(trainerPokeData[`${propName}EffortSpDef`]),
            parseInt(trainerPokeData[`${propName}EffortAgi`])
        ]

        docSet.evs = {
            hp: hp,
            at: atk,
            df: def,
            sa: spa,
            sd: spd,
            sp: spe
        };
        //This is the EV Validation code. Don't touch it, WIP
        // const evValidation = areEffortValuesValid(docSet, hp, atk, def, spa, spd, spe);
        // if (!evValidation.valid) {
        //     const response = correctPokemonEvs(evValidation, docSet, hp, atk, def, spa, spd, spe, id, pNum, name);
        //     response.changed ? evChangelog.push(`Party ${id} Slot ${pNum} - ${name} changed to ${response.source} - ${prettifyEvs(response.data)}`) : evChangelog.push(`Party ${id} Slot ${pNum} unchanged.`);
        //     docSet.evs = response.data;
        // }
    }


    docSets.push(docSet);
    return docSet;
}

function prettifyEvs({ hp, at, df, sa, sd, sp }) {
    return `HP: ${hp}, ATK: ${at}, DEF: ${df}, SPA: ${sa}, SPD: ${sd}, SPE: ${sp}`;
}


function correctPokemonEvs(evValidation, docSet, hp, atk, def, spa, spd, spe, id, pNum, name) {
    const { badMatches, badProp } = evValidation;

    const effortValues = { hp, at: atk, df: def, sa: spa, sd: spd, sp: spe };
    const documentEvSum = Object.values(docSet.evs).reduce((a, b) => a + b, 0);
    const gameEvSum = Object.values(effortValues).reduce((a, b) => a + b, 0);
    //Handle obvious legality errors
    const legality = checkSpreadLegality(docSet, hp, atk, def, spa, spd, spe, id, pNum, name);

    if (legality.changed) {
        return legality;
    }

    //Handle typo errors
    const typoResponse = handleTypoEffortValueErrors(documentEvSum, gameEvSum, docSet, effortValues);
    if (typoResponse.changed) {
        if (typoResponse.source === 'docs') {
            badGameData.push(`Bad EV Matchup (Typo): \n\tParty: ${id}\n\tParty Slot:${pNum} - ${name}\n\tDoc Data: HP: ${docSet.evs.hp}, ATK: ${docSet.evs.at}, DEF: ${docSet.evs.df}, SPA: ${docSet.evs.sa}, SPD: ${docSet.evs.sd}, SPE: ${docSet.evs.sp}\n\tGame Data: HP: ${hp}, ATK: ${atk}, DEF: ${def}, SPA: ${spa}, SPD: ${spd}, SPE: ${spe}`);
            return typoResponse;
        } else if (typoResponse.source === 'game') {
            badDocs.push(`Bad EV Matchup (Typo): \n\tParty: ${id}\n\tParty Slot:${pNum} - ${name}\n\tDoc Data: HP: ${docSet.evs.hp}, ATK: ${docSet.evs.at}, DEF: ${docSet.evs.df}, SPA: ${docSet.evs.sa}, SPD: ${docSet.evs.sd}, SPE: ${docSet.evs.sp}\n\tGame Data: HP: ${hp}, ATK: ${atk}, DEF: ${def}, SPA: ${spa}, SPD: ${spd}, SPE: ${spe}`);
            return typoResponse;
        }
    }

    if (documentEvSum >= 508 && gameEvSum < 510 && documentEvSum !== gameEvSum) {
        badGameData.push(`Bad EV Matchup (Missing Stat): \n\tParty: ${id}\n\tParty Slot:${pNum} - ${name}\n\tDoc Data: HP: ${docSet.evs.hp}, ATK: ${docSet.evs.at}, DEF: ${docSet.evs.df}, SPA: ${docSet.evs.sa}, SPD: ${docSet.evs.sd}, SPE: ${docSet.evs.sp}\n\tGame Data: HP: ${hp}, ATK: ${atk}, DEF: ${def}, SPA: ${spa}, SPD: ${spd}, SPE: ${spe}`);
        return { changed: true, source: 'docs', data: docSet.evs };
    } else if (gameEvSum >= 508 && documentEvSum < 510 && documentEvSum !== gameEvSum) {
        badDocs.push(`Bad EV Matchup (Missing Stat): \n\tParty: ${id}\n\tParty Slot:${pNum} - ${name}\n\tDoc Data: HP: ${docSet.evs.hp}, ATK: ${docSet.evs.at}, DEF: ${docSet.evs.df}, SPA: ${docSet.evs.sa}, SPD: ${docSet.evs.sd}, SPE: ${docSet.evs.sp}\n\tGame Data: HP: ${hp}, ATK: ${atk}, DEF: ${def}, SPA: ${spa}, SPD: ${spd}, SPE: ${spe}`);
        return { changed: true, source: 'game', data: { hp, at: atk, df: def, sa: spa, sd: spd, sp: spe } };
    }

    const swapAttempt = swapEvsUntilTheyWork(docSet, badProp, hp, atk, def, spa, spe, spe, id, pNum, name);
    if (swapAttempt.changed) {
        return swapAttempt;
    }

    evMatchups.push(`Bad EV Matchup (Attempted Swap Fix): ${swapAttempt.badProp}\n\tParty: ${id}\n\tParty Slot:${pNum} - ${name}\n\tDoc Data: HP: ${docSet.evs.hp}, ATK: ${docSet.evs.at}, DEF: ${docSet.evs.df}, SPA: ${docSet.evs.sa}, SPD: ${docSet.evs.sd}, SPE: ${docSet.evs.sp}\n\tGame Data: HP: ${swapAttempt.data.hp}, ATK: ${swapAttempt.data.at}, DEF: ${swapAttempt.data.df}, SPA: ${swapAttempt.data.sa}, SPD: ${swapAttempt.data.sd}, SPE: ${swapAttempt.data.sp}`)
}

function swapEvsUntilTheyWork(docSet, badProp, hp, atk, def, spa, spd, spe, id, pNum, name) {

    let swapAttempt = swapEvValues(docSet, badProp, hp, atk, def, spa, spd, spe)
    let swapAttempttValidation = areEffortValuesValid(docSet, swapAttempt.hp, swapAttempt.at, swapAttempt.df, swapAttempt.sa, swapAttempt.sd, swapAttempt.sp);
    
    if(swapAttempttValidation.badMatches?.length === 1) {
        swapAttempt = swapEvValues(docSet, swapAttempttValidation.badProp, swapAttempt.hp, swapAttempt.at, swapAttempt.df, swapAttempt.sa, swapAttempt.sd, swapAttempt.sp);
        swapAttempttValidation = areEffortValuesValid(docSet, swapAttempt.hp, swapAttempt.at, swapAttempt.df, swapAttempt.sa, swapAttempt.sd, swapAttempt.sp);
    }

    if (swapAttempttValidation.valid && isEvSpreadValid(swapAttempt) ) {
        return { changed: true, source: 'docs', data: swapAttempt };
    }

    evMatchups.push(`Bad EV Matchup (Attempted Swap Fix): ${swapAttempttValidation.badProp}\n\tParty: ${id}\n\tParty Slot:${pNum} - ${name}\n\tDoc Data: HP: ${docSet.evs.hp}, ATK: ${docSet.evs.at}, DEF: ${docSet.evs.df}, SPA: ${docSet.evs.sa}, SPD: ${docSet.evs.sd}, SPE: ${docSet.evs.sp}\n\tGame Data: HP: ${swapAttempt.hp}, ATK: ${swapAttempt.at}, DEF: ${swapAttempt.df}, SPA: ${swapAttempt.sa}, SPD: ${swapAttempt.sd}, SPE: ${swapAttempt.sp}`)
    return { changed: false, badProp: swapAttempttValidation.badProp, data: swapAttempt };
}
function handleTypoEffortValueErrors(documentEvSum, gameEvSum, docSet, gameEvs) {
    if (Math.abs(documentEvSum - gameEvSum) < 3 && documentEvSum !== gameEvSum) {
        if (documentEvSum % 2 === 0) {
            return { changed: true, source: 'docs', data: docSet.evs };
        } else if(gameEvSum % 2 === 0) {
            return { changed: true, source: 'game', data: gameEvs };
        }
    }

    return { changed: false };
}

function checkSpreadLegality(docSet, hp, atk, def, spa, spd, spe, id, pNum, name) {
    const docSetValid = isEvSpreadValid(docSet.evs);
    const y = { hp, at: atk, df: def, sa: spa, sd: spd, sp: spe };
    const attemptSetValid = isEvSpreadValid(y);
    const documentEvSum = Object.values(docSet.evs).reduce((a, b) => a + b, 0);
    const gameEvSum = Object.values(y).reduce((a, b) => a + b, 0);

    const docHasNoSpread = documentEvSum === 0;
    const gameHasNoSpread = gameEvSum === 0;

    if (!docSetValid || docHasNoSpread) {
        badDocs.push(`Illegal EV Matchup (Attempted Fix): \n\tParty: ${id}\n\tParty Slot:${pNum} - ${name}\n\tDoc Data: HP: ${docSet.evs.hp}, ATK: ${docSet.evs.at}, DEF: ${docSet.evs.df}, SPA: ${docSet.evs.sa}, SPD: ${docSet.evs.sd}, SPE: ${docSet.evs.sp}, Legal: ${docSetValid}\n\tGame Data: HP: ${hp}, ATK: ${atk}, DEF: ${def}, SPA: ${spa}, SPD: ${spd}, SPE: ${spe}, Legal: ${attemptSetValid}`);
        return { changed: true, source: 'game', data: y };
    } else if (!attemptSetValid || gameHasNoSpread) {
        badGameData.push(`Illegal EV Matchup (Attempted Fix): \n\tParty: ${id}\n\tParty Slot:${pNum} - ${name}\n\tDoc Data: HP: ${docSet.evs.hp}, ATK: ${docSet.evs.at}, DEF: ${docSet.evs.df}, SPA: ${docSet.evs.sa}, SPD: ${docSet.evs.sd}, SPE: ${docSet.evs.sp}, Legal: ${docSetValid}\n\tGame Data: HP: ${hp}, ATK: ${atk}, DEF: ${def}, SPA: ${spa}, SPD: ${spd}, SPE: ${spe}, Legal: ${attemptSetValid}`);
        return { changed: true, source: 'docs', data: docSet.evs };
    } else {
        return { changed: false }
    }
}

function swapEvValues(docSet, evString, hp, at, df, sa, sd, sp) {
    const statMap = { 'HP': hp, 'ATK': at, 'DEF': df, 'SPA': sa, 'SPD': sd, 'SPE': sp };
    const rawAttribs = evString.trim().split(' ')
    const attribs = rawAttribs.map(x => getAttribName(x.trim()));

    const pokemonEvs = { hp, at, df, sa, sd, sp };

    
    for (let attrib of attribs) {
        pokemonEvs[attrib] = docSet.evs[attrib];
    }

    return pokemonEvs;
}
function isEvSpreadValid({ hp, at, df, sa, sd, sp }) {
    if (hp > 255) return false;
    if (at > 255) return false;
    if (df > 255) return false;
    if (sa > 255) return false;
    if (sd > 255) return false;
    if (sp > 255) return false;

    const evSum = (hp + at + df + sa + sd + sp)
    if (isNaN(evSum)) throw Error(`EV Sum is NaN: ${evSum}`)
    return evSum <= 510;
}

function areEffortValuesValid(docSet, hp, atk, def, spa, spd, spe) {
    let badProp = '';
    let badMatches = [];
    if (docSet.evs.hp !== hp) {
        badProp += 'HP '
        badMatches.push('HP');
    }
    if (docSet.evs.at !== atk) {
        badProp += 'ATK '
        badMatches.push('ATK');
    }
    if (docSet.evs.df !== def) {
        badProp += 'DEF '
        badMatches.push('DEF');
    }
    if (docSet.evs.sa !== spa) {
        badProp += 'SPA '
        badMatches.push('SPA');
    }
    if (docSet.evs.sd !== spd) {
        badProp += 'SPD '
        badMatches.push('SPD');
    }
    if (docSet.evs.sp !== spe) {
        badProp += 'SPE '
        badMatches.push('SPE');
    }
    return badProp === '' ? { valid: true } : { valid: false, badProp, badMatches };
}

rawDocumentFile.split('\n').forEach((line, i) => {
    if (line > 3) return;
    const [
        trainerID, rawTrainerName, LevelCap, format,
        //P1
        pokemon1Icon, Pokemon1Name, Pokemon1Level, Pokemon1Nature, Pokemon1Ability, Item1Icon, Item1Name,
        Pokemon1Move1, Pokemon1Move2, Pokemon1Move3, Pokemon1Move4, Pokemon1IV, Pokemon1EV,
        //P2
        Pokemon2Icon, Pokemon2Name, Pokemon2Level, Pokemon2Nature, Pokemon2Ability, Item2Icon, Item2Name,
        Pokemon2Move1, Pokemon2Move2, Pokemon2Move3, Pokemon2Move4, Pokemon2IV, Pokemon2EV,
        //P3
        Pokemon3Icon, Pokemon3Name, Pokemon3Level, Pokemon3Nature, Pokemon3Ability, Item3Icon, Item3Name,
        Pokemon3Move1, Pokemon3Move3, Pokemon3Move2, Pokemon3Move4, Pokemon3IV, Pokemon3EV,
        //P4
        Pokemon4Icon, Pokemon4Name, Pokemon4Level, Pokemon4Nature, Pokemon4Ability, Item4Icon, Item4Name,
        Pokemon4Move1, Pokemon4Move2, Pokemon4Move3, Pokemon4Move4, Pokemon4IV, Pokemon4EV,
        //P5
        Pokemon5Icon, Pokemon5Name, Pokemon5Level, Pokemon5Nature, Pokemon5Ability, Item5Icon, Item5Name,
        Pokemon5Move1, Pokemon5Move2, Pokemon5Move3, Pokemon5Move4, Pokemon5IV, Pokemon5EV,
        //P6
        Pokemon6Icon, Pokemon6Name, Pokemon6Level, Pokemon6Nature, Pokemon6Ability, Item6Icon, Item6Name,
        Pokemon6Move1, Pokemon6Move2, Pokemon6Move3, Pokemon6Move4, Pokemon6IV, Pokemon6EV, trainerItem, specialNotes
    ] = line.split(',').map(x => x.trim());

    const trainerName = generateTrainerName(rawTrainerName, Pokemon1Level);

    const party = {};
    if (trainerID && !isNaN(parseInt(trainerID))) {

        const missingTrainerIdx = missingTrainers.findIndex(e => e.trainerId == trainerID);
        if(missingTrainerIdx !== -1) {
            missingTrainers.splice(missingTrainerIdx, 1);
        }

        const p1Level = parseInt(trainerData.TrainerPoke[trainerID].P1Level);
        const p2Level = parseInt(trainerData.TrainerPoke[trainerID].P2Level);
        const p3Level = parseInt(trainerData.TrainerPoke[trainerID].P3Level);
        const p4Level = parseInt(trainerData.TrainerPoke[trainerID].P4Level);
        const p5Level = parseInt(trainerData.TrainerPoke[trainerID].P5Level);
        const p6Level = parseInt(trainerData.TrainerPoke[trainerID].P6Level);

        // if(p1Level != Pokemon1Level) {
        //     console.warn(`Bad level mismatch Party ID: ${trainerID}, Slot 1, [Doc: ${Pokemon1Level}, Game: ${p1Level}]`)
        // }
        // if(p2Level != Pokemon2Level) {
        //     console.warn(`Bad level mismatch Party ID: ${trainerID}, Slot 2, [Doc: ${Pokemon2Level}, Game: ${p2Level}]`)
        // }
        // if(p3Level != Pokemon3Level) {
        //     console.warn(`Bad level mismatch Party ID: ${trainerID}, Slot 3, [Doc: ${Pokemon3Level}, Game: ${p3Level}]`)
        // }
        // if(p4Level != Pokemon4Level) {
        //     console.warn(`Bad level mismatch Party ID: ${trainerID}, Slot 4, [Doc: ${Pokemon4Level}, Game: ${p4Level}]`)
        // }
        // if(p5Level != Pokemon5Level) {
        //     console.warn(`Bad level mismatch Party ID: ${trainerID}, Slot 5, [Doc: ${Pokemon5Level}, Game: ${p5Level}]`)
        // }
        // if(p6Level != Pokemon6Level) {
        //     console.warn(`Bad level mismatch Party ID: ${trainerID}, Slot 6, [Doc: ${Pokemon6Level}, Game: ${p6Level}]`)
        // }
        const p1 = generateDocPokemonObject(Pokemon1Name, p1Level, Pokemon1Nature, Pokemon1Ability, Item1Name, Pokemon1Move1, Pokemon1Move2, Pokemon1Move3, Pokemon1Move4, Pokemon1IV, Pokemon1EV, trainerID, 1);
        const p2 = generateDocPokemonObject(Pokemon2Name, p2Level, Pokemon2Nature, Pokemon2Ability, Item2Name, Pokemon2Move1, Pokemon2Move2, Pokemon2Move3, Pokemon2Move4, Pokemon2IV, Pokemon2EV, trainerID, 2);
        const p3 = generateDocPokemonObject(Pokemon3Name, p3Level, Pokemon3Nature, Pokemon3Ability, Item3Name, Pokemon3Move1, Pokemon3Move2, Pokemon3Move3, Pokemon3Move4, Pokemon3IV, Pokemon3EV, trainerID, 3);
        const p4 = generateDocPokemonObject(Pokemon4Name, p4Level, Pokemon4Nature, Pokemon4Ability, Item4Name, Pokemon4Move1, Pokemon4Move2, Pokemon4Move3, Pokemon4Move4, Pokemon4IV, Pokemon4EV, trainerID, 4);
        const p5 = generateDocPokemonObject(Pokemon5Name, p5Level, Pokemon5Nature, Pokemon5Ability, Item5Name, Pokemon5Move1, Pokemon5Move2, Pokemon5Move3, Pokemon5Move4, Pokemon5IV, Pokemon5EV, trainerID, 5);
        const p6 = generateDocPokemonObject(Pokemon6Name, p6Level, Pokemon6Nature, Pokemon6Ability, Item6Name, Pokemon6Move1, Pokemon6Move2, Pokemon6Move3, Pokemon6Move4, Pokemon6IV, Pokemon6EV, trainerID, 6);



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


const sets = {}

function parseIvs(ivString) {
    const x = ivString.replace('All ', '');
    const ivs = x.split('/')
    if (ivs.length === 1) {
        const iv = parseInt(ivs[0].trim())
        return { hp: iv, at: iv, df: iv, sa: iv, sd: iv, sp: iv };
    }

    if (ivString.includes('All') && ivs.length === 2) {
        const [value, rawAttr] = ivs[0].trim().split(' ');
        const iv = parseInt(value.trim());
        const pokemonIvs = { hp: iv, at: iv, df: iv, sa: iv, sd: iv, sp: iv };

        const [value2, rawAttr2] = ivs[1].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr2)] = parseInt(value2.trim());
        return pokemonIvs;
    }
    if (ivs.length === 2) {
        const pokemonIvs = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
        const [value, rawAttr] = ivs[0].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr)] = parseInt(value.trim());
        const [value2, rawAttr2] = ivs[1].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr2)] = parseInt(value2.trim());
        return pokemonIvs;
    }
    if (ivs.length === 6) {
        const parsedIvs = ivs.map(x => parseInt(x.trim()));
        return { hp: parsedIvs[0], at: parsedIvs[1], df: parsedIvs[2], sa: parsedIvs[3], sd: parsedIvs[4], sp: parsedIvs[5] }
    }
}

function parseEvs(ivString) {
    if (!ivString || ivString === 'None') return { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
    const x = ivString.replace('All ', '');
    const ivs = x.split('/');
    if (ivs.length === 1) {
        const pokemonIvs = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
        const [value, rawAttr] = ivs[0].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr)] = parseInt(value.trim());
        return pokemonIvs;
    }
    if (ivs.length === 2) {
        const pokemonIvs = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
        const [value, rawAttr] = ivs[0].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr)] = parseInt(value.trim());
        const [value2, rawAttr2] = ivs[1].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr2)] = parseInt(value2.trim());
        return pokemonIvs;
    }
    if (ivs.length === 3) {
        const pokemonIvs = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
        const [value, rawAttr] = ivs[0].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr)] = parseInt(value.trim());
        const [value2, rawAttr2] = ivs[1].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr2)] = parseInt(value2.trim());
        const [value3, rawAttr3] = ivs[2].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr3)] = parseInt(value3.trim());
        return pokemonIvs
    }

    if (ivs.length === 4) {
        const pokemonIvs = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
        const [value, rawAttr] = ivs[0].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr)] = parseInt(value.trim());
        const [value2, rawAttr2] = ivs[1].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr2)] = parseInt(value2.trim());
        const [value3, rawAttr3] = ivs[2].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr3)] = parseInt(value3.trim());
        const [value4, rawAttr4] = ivs[3].trim().split(' ');
        pokemonIvs[getAttribName(rawAttr4)] = parseInt(value4.trim());
        return pokemonIvs
    }

    if (ivs.length === 5) {
        const parsedIvs = ivs.map(x => parseInt(x.trim()));
        return { hp: parsedIvs[0], at: parsedIvs[1], df: parsedIvs[2], sa: parsedIvs[3], sd: parsedIvs[4], sp: 0 };
        //return pokemonIvs;
    }
    if (ivs.length === 6) {
        const parsedIvs = ivs.map(x => parseInt(x.trim()));
        return { hp: parsedIvs[0], at: parsedIvs[1], df: parsedIvs[2], sa: parsedIvs[3], sd: parsedIvs[4], sp: parsedIvs[5] }
    }
}

function getAttribName(str) {
    switch (str?.toUpperCase()) {
        case 'HP':
            return 'hp';
        case 'ATK':
            return 'at';
        case 'DEF':
            return 'df';
        case 'SPD':
            return 'sd';
        case 'SPA':
            return 'sa';
        case 'SPE':
            return 'sp';
        default:
            console.warn('GetAttribError:', str);
            throw Error();
    }
}

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