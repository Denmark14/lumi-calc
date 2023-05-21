

function parseIvs(ivString) {
    try {
        if(ivString.includes('Al') && !ivString.includes('All')) throw Error(`bad All: ${ivString}`)
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

        throw Error(`Unhandled IV parse: ${ivString}`);
    } catch(e) {
        console.log(ivString)
        throw Error(e);
    }
    
}

function parseEvs(evString) {
    try {
        if (!evString || evString === 'None') return { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
        const x = evString.replace('All ', '');
        const evs = x.split('/');
        if (evs.length === 1) {
            const pokemonEvs = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
            const [value, rawAttr] = evs[0].trim().split(' ');
            pokemonEvs[getAttribName(rawAttr)] = parseInt(value.trim());
            return pokemonEvs;
        }
        if (evs.length === 2) {
            const pokemonEvs = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
            const [value, rawAttr] = evs[0].trim().split(' ');
            pokemonEvs[getAttribName(rawAttr)] = parseInt(value.trim());
            const [value2, rawAttr2] = evs[1].trim().split(' ');
            pokemonEvs[getAttribName(rawAttr2)] = parseInt(value2.trim());
            return pokemonEvs;
        }
        if (evs.length === 3) {
            const pokemonEvs = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
            const [value, rawAttr] = evs[0].trim().split(' ');
            pokemonEvs[getAttribName(rawAttr)] = parseInt(value.trim());
            const [value2, rawAttr2] = evs[1].trim().split(' ');
            pokemonEvs[getAttribName(rawAttr2)] = parseInt(value2.trim());
            const [value3, rawAttr3] = evs[2].trim().split(' ');
            pokemonEvs[getAttribName(rawAttr3)] = parseInt(value3.trim());
            return pokemonEvs
        }

        if (evs.length === 4) {
            const pokemonEvs = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
            const [value, rawAttr] = evs[0].trim().split(' ');
            pokemonEvs[getAttribName(rawAttr)] = parseInt(value.trim());
            const [value2, rawAttr2] = evs[1].trim().split(' ');
            pokemonEvs[getAttribName(rawAttr2)] = parseInt(value2.trim());
            const [value3, rawAttr3] = evs[2].trim().split(' ');
            pokemonEvs[getAttribName(rawAttr3)] = parseInt(value3.trim());
            const [value4, rawAttr4] = evs[3].trim().split(' ');
            pokemonEvs[getAttribName(rawAttr4)] = parseInt(value4.trim());
            return pokemonEvs
        }

        if (evs.length === 6) {
            const parsedEvs = evs.map(x => parseInt(x.trim()));
            return { hp: parsedEvs[0], at: parsedEvs[1], df: parsedEvs[2], sa: parsedEvs[3], sd: parsedEvs[4], sp: parsedEvs[5] }
        }

        throw Error(`Unhandled EV parse: ${evString}`);

    } catch(e) {
        console.log(evString);
        throw Error(e);
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

function checkValues(evs, evString, id, name) {
    if(Object.values(evs).find(e => e > 252)) throw Error(`Bad values: ${id} - ${name} - ${evString}`)
    const sum = evs.hp + evs.at + evs.df + evs.sa + evs.sd + evs.sp;
    if(sum > 512) throw Error(`Too many: ${id} - ${name} - ${sum} - ${evString}`)
    return true;
}

module.exports = {
    parseEvs,
    parseIvs,
    getAttribName,
    checkValues
}