const fs = require('fs');
const path = require('path');
const parentFilePath = path.resolve(__dirname, '..');
const pokemonData = require('../input/PersonalTable.json');
const {
    getPokemonName,
    getTypes,
    makeAbilityObject,
    getGender,
    getFormName,
} = require('./pokemonUtils');

const speciesData = pokemonData.Personal.reduce((pkmn, currentPokemon, index) => {
    if (index === 0) return pkmn;

    const formIndex = currentPokemon.form_index;
    if (formIndex === 0 || currentPokemon.id === currentPokemon.monsno) {
        const name = getPokemonName(currentPokemon.monsno);
        pkmn[name] = createPokemonObject(currentPokemon, name);
        const gender = getGender(currentPokemon.sex);
        if (gender) {
            pkmn[name].gender = gender;
        }
        return pkmn;
    }

    const name = getPokemonName(currentPokemon.monsno);
    let formName = getFormName(index);
    const badList = ["Galarian Farfetch'd", "Ash-Greninja", "Meowstic-F", "Indeedee-F", "Basculegion-F", "SPOOKYDEVTHING", "Rockruff Own-Tempo"]
    if (!formName) {
        console.warn('Form Error:', index, formName, name);
    }
    if (formName && !formName.includes(name) && !badList.includes(formName)) {
      formName = name + ' ' + getFormName(index);
    }
    if (!pkmn[name].hasOwnProperty('otherFormes')) {
        pkmn[name].otherFormes = [];
    }
    pkmn[name].otherFormes.push(formName);
    pkmn[formName] = createPokemonObject(currentPokemon, name, formName);
    pkmn[formName].baseSpecies = name;
    const gender = getGender(currentPokemon.sex);
    if (gender) {
        pkmn[formName].gender = gender;
    }
    return pkmn;
}, {});

function createPokemonObject(currentPokemon, name, formName) {
    const obj = {};
    obj.types = getTypes(currentPokemon);
    obj.bs = { hp: currentPokemon.basic_hp, at: currentPokemon.basic_atk, df: currentPokemon.basic_def, sa: currentPokemon.basic_spatk, sd: currentPokemon.basic_spdef, sp: currentPokemon.basic_agi }
    obj.weightkg = currentPokemon.weight / 10;
    obj.abilities = makeAbilityObject(currentPokemon.tokusei3)
    if (formName) {
        obj.otherFormes = [formName];
    }
    return obj;
}

function createSpeciesFile(lumiMons) {
    const speciesFile = fs.readFileSync(path.join(__dirname, 'species.txt'), 'utf-8');
    const specialLine = 'const SS_PATCH: {[name: string]: DeepPartial<SpeciesData>} = ';
    const startIndex = speciesFile.indexOf(specialLine)
    const endIndex = startIndex + specialLine.length;
    const newFile = [speciesFile.slice(0, endIndex), JSON.stringify(lumiMons, null, 2), ';' ,speciesFile.slice(endIndex)].join('');
    const speciesFilePath = path.join(parentFilePath, 'calc', 'src', 'data');

    fs.writeFileSync(path.join(speciesFilePath, 'species.ts'), newFile, 'utf-8');
}

createSpeciesFile(speciesData)
module.exports = function() {
    fs.writeFileSync(path.join(parentFilePath, 'output', 'LumiMons.json'), JSON.stringify(speciesData), 'utf-8');
};

