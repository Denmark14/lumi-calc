const fs = require('fs');
const path = require('path')
const TrainerTable = require('../input/TrainerTable.json');
const parentFilePath = path.resolve(__dirname, '..');
const rawDocumentFile = fs.readFileSync(path.join(parentFilePath, 'input', 'docs.csv'), 'utf-8');
const {generateTrainerName} = require('./trainerUtils');
const PersonalTable = require('../input/PersonalTable.json')
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
    getFormNameFromDocumentation,
    getPokemonIdFromDocumentation,
    FORM_MAP
} = require('./pokemonUtils');

const {
    parseEvs,
    parseIvs,
    getAttribName,
    checkValues
} = require('./docUtils');

if(!fs.existsSync(path.join(parentFilePath, 'output'))) {
    fs.mkdirSync(path.join(parentFilePath, 'output'));
}

function stripTypeFromHiddenPower(str) {
    const i = str.indexOf('(');
    return str.substring(0, i).trim();
}

const parties = [];

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

    const docParty = [
        [
            Pokemon1Name, Pokemon1Level, Pokemon1Nature, Pokemon1Ability, Item1Name,
            Pokemon1Move1, Pokemon1Move2, Pokemon1Move3, Pokemon1Move4,
            Pokemon1IV, Pokemon1EV
        ],
        //P2
        [
            Pokemon2Name, Pokemon2Level, Pokemon2Nature, Pokemon2Ability, Item2Name,
            Pokemon2Move1, Pokemon2Move2, Pokemon2Move3, Pokemon2Move4,
            Pokemon2IV, Pokemon2EV
        ],
        //P3
        [
            Pokemon3Name, Pokemon3Level, Pokemon3Nature, Pokemon3Ability, Item3Name,
            Pokemon3Move1, Pokemon3Move3, Pokemon3Move2, Pokemon3Move4,
            Pokemon3IV, Pokemon3EV
        ],
        //P4
        [
            Pokemon4Name, Pokemon4Level, Pokemon4Nature, Pokemon4Ability, Item4Name,
            Pokemon4Move1, Pokemon4Move2, Pokemon4Move3, Pokemon4Move4,
            Pokemon4IV, Pokemon4EV
        ],
        //P5
        [
            Pokemon5Name, Pokemon5Level, Pokemon5Nature, Pokemon5Ability, Item5Name,
            Pokemon5Move1, Pokemon5Move2, Pokemon5Move3, Pokemon5Move4,
            Pokemon5IV, Pokemon5EV
        ],
        //P6
        [
            Pokemon6Name, Pokemon6Level, Pokemon6Nature, Pokemon6Ability, Item6Name,
            Pokemon6Move1, Pokemon6Move2, Pokemon6Move3, Pokemon6Move4,
            Pokemon6IV, Pokemon6EV
        ]
    ];
    if (!trainerID || isNaN(parseInt(trainerID))) {
        return;
    }

    const party = docParty.map((docPokemon, index) => {
        if (!trainerID || isNaN(parseInt(trainerID))) return null;
        let [
            pokemonName, levelString, natureName, abilityName, itemName,
            move1Name, move2Name, move3Name, move4Name,
            ivString, evString
        ] = docPokemon;

        if (move1Name.includes('Hidden Power')) {
            move1Name = stripTypeFromHiddenPower(move1Name);
        }
        if (move2Name.includes('Hidden Power')) {
            move2Name = stripTypeFromHiddenPower(move2Name);
        }
        if (move3Name.includes('Hidden Power')) {
            move3Name = stripTypeFromHiddenPower(move3Name);
        }
        if (move4Name.includes('Hidden Power')) {
            move4Name = stripTypeFromHiddenPower(move4Name);
        }

        if(!pokemonName || isNaN(parseInt(levelString))) return generateDefaultParty(index);

        const pokemonId = parseInt(getPokemonId(pokemonName));
        const {monsno, form_no} = getPokemonMonsNo(pokemonId);
        const isRare = 0;
        const level = parseInt(levelString);
        const sex = getSex(pokemonId)//teehee
        const nature = getNatureId(natureName);
        const ability = getAbilityIdFromAbilityName(abilityName);
        const move1 = getMoveId(move1Name);
        const move2 = getMoveId(move2Name);
        const move3 = getMoveId(move3Name);
        const move4 = getMoveId(move4Name);
        const item = getItemIdFromItemName(itemName);
        const ball = 28;
        const seal = -1;

        const ivs = parseIvs(ivString);
        const evs = parseEvs(evString);
        checkValues(ivs, ivString, rawTrainerName, pokemonName)
        checkValues(evs, evString,  rawTrainerName, pokemonName)
        
        return {
            [`P${index + 1}MonsNo`]: monsno,
            [`P${index + 1}FormNo`]: form_no,
            [`P${index + 1}IsRare`]: 0,
            [`P${index + 1}Level`]: level,
            [`P${index + 1}Sex`]: sex,
            [`P${index + 1}Seikaku`]: nature,
            [`P${index + 1}Tokusei`]: ability,
            [`P${index + 1}Waza1`]: move1,
            [`P${index + 1}Waza2`]: move2,
            [`P${index + 1}Waza3`]: move3,
            [`P${index + 1}Waza4`]: move4,
            [`P${index + 1}Item`]: item,
            [`P${index + 1}Ball`]: ball,
            [`P${index + 1}Seal`]: seal,
            [`P${index + 1}TalentHp`]: ivs.hp,
            [`P${index + 1}TalentAtk`]: ivs.at,
            [`P${index + 1}TalentDef`]: ivs.df,
            [`P${index + 1}TalentSpAtk`]: ivs.sa,
            [`P${index + 1}TalentSpDef`]: ivs.sd,
            [`P${index + 1}TalentAgi`]: ivs.sp,
            [`P${index + 1}EffortHp`]: evs.hp,
            [`P${index + 1}EffortAtk`]: evs.at,
            [`P${index + 1}EffortDef`]: evs.df,
            [`P${index + 1}EffortSpAtk`]: evs.sa,
            [`P${index + 1}EffortSpDef`]: evs.sd,
            [`P${index + 1}EffortAgi`]: evs.sp,
        }
    }).reduce((acc, curr) => {
        for(let [key, value] of Object.entries(curr)) {
            acc[key] = value;
        }

        return acc;
    }, {ID: parseInt(trainerID)})
    parties.push(party);
})

function getPokemonId(nameString) {
    const monsno = getPokemonIdFromDocumentation(nameString);
    if(monsno < 1 || isNaN(parseInt(monsno))) throw Error(`Bad name: ${nameString} ${monsno}`)
    return monsno
}

function getSex(pokemonId) {
    // 0 = M, 1 = F, 2 = Genderless, 3 = Random
    return 3;
}

function getPokemonMonsNo(pokemonId) {
    try {
        const monsno = PersonalTable.Personal.find(e => e.id === pokemonId).monsno;
        return {monsno, form_no: FORM_MAP[monsno].findIndex(e => e === pokemonId)};
    } catch(e) {
        console.log(pokemonId)
        throw Error(e);
    }
    
}

function generateDefaultParty(index) {
    return {
        [`P${index + 1}MonsNo`]: 0,
            [`P${index + 1}FormNo`]: 0,
            [`P${index + 1}IsRare`]: 0,
            [`P${index + 1}Level`]: 0,
            [`P${index + 1}Sex`]: 0,
            [`P${index + 1}Seikaku`]: 0,
            [`P${index + 1}Tokusei`]: 0,
            [`P${index + 1}Waza1`]: 0,
            [`P${index + 1}Waza2`]: 0,
            [`P${index + 1}Waza3`]: 0,
            [`P${index + 1}Waza4`]: 0,
            [`P${index + 1}Item`]: 0,
            [`P${index + 1}Ball`]: 0,
            [`P${index + 1}Seal`]: 0,
            [`P${index + 1}TalentHp`]: 0,
            [`P${index + 1}TalentAtk`]: 0,
            [`P${index + 1}TalentDef`]: 0,
            [`P${index + 1}TalentSpAtk`]: 0,
            [`P${index + 1}TalentSpDef`]: 0,
            [`P${index + 1}TalentAgi`]: 0,
            [`P${index + 1}EffortHp`]: 0,
            [`P${index + 1}EffortAtk`]: 0,
            [`P${index + 1}EffortDef`]: 0,
            [`P${index + 1}EffortSpAtk`]: 0,
            [`P${index + 1}EffortSpDef`]: 0,
            [`P${index + 1}EffortAgi`]: 0,
    }
}

fs.writeFileSync(path.join(parentFilePath, 'output', 'NewTrainerTable.json'), JSON.stringify(parties, null, 4), 'utf-8');