import os
import json
import unicodedata
import re 

parent_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_monsname.json')
ability_namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_tokusei.json')
type_namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_typename.json')
forms_namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_zkn_form.json')
nature_namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_seikaku.json')
items_namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_itemname.json')
moves_namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_wazaname.json')
smogon_movedata_file_path = os.path.join(parent_file_path, 'input', 'moves.json')
learnset_file_path = os.path.join(parent_file_path, 'input', 'WazaOboeTable.json')
egg_learnset_file_path = os.path.join(parent_file_path, 'input', 'TamagoWazaTable.json')
personal_data_path = os.path.join(parent_file_path, 'input', 'PersonalTable.json')
movestable_file_path = os.path.join(parent_file_path, 'input', 'WazaTable.json')
move_info_file_path = os.path.join(parent_file_path, 'input', 'english_ss_wazainfo.json')
pkmn_height_file_path = os.path.join(parent_file_path, 'input', 'english_ss_zkn_height.json')
pkmn_weight_file_path = os.path.join(parent_file_path, 'input', 'english_ss_zkn_weight.json')
item_table_file_path = os.path.join(parent_file_path, 'input', 'ItemTable.json')
output_file_path =os.path.join(parent_file_path, "src", "tasks", "output")

move_enum = 0
name_data = 0
ability_namedata = 0
type_namedata = 0
form_namedata = 0
nature_namedata = 0
item_namedata = 0
SMOGON_MOVES = 0
learnset_data = 0
personal_data = 0
moves_namedata = 0
egg_learnset = 0
MovesTable = 0
move_info_data = 0
pkmn_height_data = 0
pkmn_weight_data = 0
ItemTable = 0
FORM_MAP = {}

_move_properties_cache = {}  # cache for move properties

# Load all the JSON Data

with open(personal_data_path, mode='r', encoding="utf-8") as f:
    personal_data = json.load(f)
    for curr in personal_data['Personal']:
        if curr['monsno'] not in FORM_MAP:
            FORM_MAP[curr['monsno']] = []
        FORM_MAP[curr['monsno']].append(curr['id'])

with open(namedata_file_path, mode='r', encoding="utf-8") as f:
    name_data = json.load(f)

with open(item_table_file_path, mode='r', encoding="utf-8") as f:
    ItemTable = json.load(f)

with open(move_info_file_path, mode='r', encoding="utf-8") as f:
    move_info_data = json.load(f)

with open(pkmn_height_file_path, mode='r', encoding="utf-8") as f:
    pkmn_height_data = json.load(f)

with open(pkmn_weight_file_path, mode='r', encoding="utf-8") as f:
    pkmn_weight_data = json.load(f)

with open(egg_learnset_file_path, mode='r', encoding="utf-8") as f:
    egg_learnset = json.load(f)

with open(ability_namedata_file_path, mode='r', encoding="utf-8") as f:
    ability_namedata = json.load(f)

with open(moves_namedata_file_path, mode='r', encoding="utf-8") as f:
    moves_namedata = json.load(f)

with open(movestable_file_path, mode='r', encoding="utf-8") as f:
    MovesTable = json.load(f)

with open(type_namedata_file_path, mode='r', encoding="utf-8") as f:
    type_namedata = json.load(f)

with open(forms_namedata_file_path, mode='r', encoding="utf-8") as f:
    form_namedata = json.load(f)

with open(nature_namedata_file_path, mode='r', encoding="utf-8") as f:
    nature_namedata = json.load(f)

with open(items_namedata_file_path, mode='r', encoding="utf-8") as f:
    item_namedata = json.load(f)

with open(smogon_movedata_file_path, mode='r', encoding="utf-8") as f:
    SMOGON_MOVES = json.load(f)

with open(learnset_file_path, mode='r', encoding="utf-8") as f:
    learnset_data = json.load(f)

with open(os.path.join(parent_file_path, 'input', 'moves.txt'), encoding="utf-8") as f:
    move_enum = [line.strip() for line in f if line.strip()]

def get_types(e):
    if e['type1'] == e['type2']:
        return [get_type_name(e['type1'])]
    else:
        return [get_type_name(e['type1']), get_type_name(e['type2'])]
    
def get_type_name(typeId):
    return type_namedata["labelDataArray"][typeId]["wordDataArray"][0]["str"]

def make_ability_object(ha):
    abilitiyString = ability_namedata["labelDataArray"][ha]["wordDataArray"][0]["str"]
    return {0: abilitiyString}

def get_pokemon_name(mons_no = 0):
    try:
        pokemon_name = ""
        if mons_no < len(name_data["labelDataArray"]):
            pokemon_name = name_data["labelDataArray"][mons_no]["wordDataArray"][0]["str"]
        else:
            pokemon_name = get_form_name(mons_no)

        pokemon_name = pokemon_name.replace('♀', '-F')
        pokemon_name = pokemon_name.replace('♂', '-M')
        pokemon_name = pokemon_name.replace('’', '\u2019')
        return pokemon_name
    except Exception as e:
        print(mons_no, e)

def get_form_name(id):
    if id == 1242:
        return 'Ash-Greninja'
    elif id == 1285:
        return 'Meowstic-F'
    elif id == 1310:
        return 'Rockruff Own-Tempo'
    elif id == 1441:
        return 'Indeedee-F'
    elif id == 1454:
        return 'Basculegion-F'
    elif id == 1456:
        return 'Oinkologne-F'
    else:
        name = form_namedata['labelDataArray'][id]['wordDataArray'][0]['str']
        dexNum = form_namedata['labelDataArray'][id]['labelName'][-7:-4]
        if(name == ""):
            return get_pokemon_name(id)
        if(get_pokemon_name(int(dexNum)) not in name):
            return get_pokemon_name(int(dexNum)) + ' ' + name
        return name
    
def get_item_string(item_id):
    item_data = item_namedata["labelDataArray"][item_id]["wordDataArray"]
    if(len(item_data) == 0):
        return 'None'
    return item_data[0]["str"]

def get_ability_string(ability_id):
    ability_string = ability_namedata["labelDataArray"][ability_id]["wordDataArray"][0]["str"]
    if not ability_string:
        print(f"Missing ability string for ID {ability_id}")
    return ability_string

def get_nature_name(natureId):
    return nature_namedata["labelDataArray"][natureId]["wordDataArray"][0]["str"]

def is_smogon_compatible(str):
    for gen in SMOGON_MOVES:
        if str in gen.keys():
            return True
    return False

def get_move_id(move_name):
    if not move_name:
        return 0
    id = next((i for i, e in enumerate(move_enum) if e == move_name.strip()), -1)
    return id

def get_ability_id_from_ability_name(ability_string):
    if not ability_string:
        return -1
    ability_id = next((i for i, e in enumerate(ability_namedata['labelDataArray']) if e['wordDataArray'][0]['str'] == ability_string), -1)
    return ability_id

def get_pokemon_mons_no_from_name(pokemon_name):
    if not pokemon_name:
        return -1
    mons_no = next((i for i, e in enumerate(name_data['labelDataArray']) if e['wordDataArray'][0]['str'] == pokemon_name), -1)
    return mons_no

def get_nature_id(nature_string):
    if not nature_string:
        return -1
    nature_id = next((i for i, e in enumerate(nature_namedata['labelDataArray']) if e['wordDataArray'][0]['str'] == nature_string), -1)
    return nature_id

def generate_moves_via_learnset(mons_no, level):
    """
        This function generates the learnset for a Pokemon by the inputted level.
        It does this by finding the 4 most recent moves in the list and returns them.
    """
    moveset = learnset_data['WazaOboe'][mons_no]['ar']
    idx = next((i for i in range(0, len(moveset), 2) if moveset[i] > level), len(moveset))
    moves = [get_move_string(moveset[i]) for i in range(0, idx, 2)]
    return [moves[-7], moves[-5], moves[-3], moves[-1]]

def get_move_string(id=0):
    str_ = move_enum[id]
    if not is_smogon_compatible(str_):
        raise ValueError(f'Incompatible move string found: ID - {id}, String: {str_}')
    return str_

def get_item_id_from_item_name(item_name):
    if not item_name:
        return -1
    for i, item in enumerate(item_namedata['labelDataArray']):
        if item['wordDataArray'][0]['str'] == item_name:
            return i
    return -1

def get_gender(sex):
    if sex == 0:
        return 'M'
    elif sex == 254:
        return 'F'
    elif sex == 255:
        return 'N'
    return None

def get_moves(m1, m2, m3, m4, monsno, level):
    """
    If all the moves are zero, one should assume their learnset is generated by BDSP
    Otherwise, return moves are per their strings
    """
    if m1 == m2 and m1 == m3 and m1 == m4:
        return generate_moves_via_learnset(monsno, level)

    moves = [
        move_enum[m1],
        move_enum[m2],
        move_enum[m3],
        move_enum[m4]
    ]

    if moves[0] is None:
        print(f"Moves: {m1}, {m2}, {m3}, {m4}, {monsno}, {moves}")
    
    return moves

def get_pokemon_form_id(monsno=0, id_=0):
    """
    BDSP does not view Pokemon in a format such as "MonsNo 3, Form 2".
    In order to get such a list for easier reasoning, one must generate it.
    That is what FORM_MAP does, and we should use it across all the util functions. 

    MonsNo (int): [form0 (Vanilla, ie. Bulbasaur), form1, ...]
    """
    return FORM_MAP[monsno].index(id_)

def get_form_pokemon_personal_id(monsno=0, formNo=0):
    try:
        return FORM_MAP[int(monsno)][int(formNo)]
    except IndexError:
        return None


def get_move_properties(move_id=0):
    """
    If you ever need the properties of a move to be displayed, you can acquire all the data here.
    Just provide the move_id as an int
    """
    move = MovesTable['Waza'][move_id]
    type_ = move['type']
    damage_type = move['damageType']
    power = move['power']
    hit_per = move['hitPer']
    base_pp = move.get('basePP', 0)
    max_pp = int(base_pp * (8 / 5))

    name_data = moves_namedata['labelDataArray'][move_id]['wordDataArray']
    name = name_data[0]['str'] if name_data else 'None'
    desc = get_move_description(move_id)

    return {
        'name': name,
        'desc': desc,
        'type': type_,
        'damageType': damage_type,
        'maxPP': max_pp,
        'power': power,
        'accuracy': hit_per,
    }

def get_move_description(move_id=0):
    """
    Returns the in-game description of a move.
    """
    word_data = move_info_data['labelDataArray'][move_id]['wordDataArray']
    description = ' '.join(wd['str'] for wd in word_data)
    return description


def get_pokemon_name_dictionary():
    pokemon = {}
    for (idx, p) in enumerate(personal_data["Personal"]):
        if(idx == 0):
            continue
        if(not str(p["monsno"]) in pokemon):
            pokemon[str(p["monsno"])] = []
        pokemon[str(p["monsno"])].append(get_form_name(p["id"]))
    return pokemon

def get_egg_moves(dex_id=0):
    """
    Requires the ID of a Pokemon, not the MonsNo, this is how we must handle Forms.
    """
    monsno = personal_data['Personal'][dex_id]['monsno']
    form_no = get_pokemon_form_id(monsno, dex_id)
    egg_moves = [e['wazaNo'] for e in egg_learnset['Data'] if e['no'] == monsno and e['formNo'] == form_no]
    return [{'level': 'egg', 'moveId': move_id} for move_id in egg_moves]


def parse_tm_learnset_section(dec):
    """
    TM learnset are stored in 4 separate 32 bit binary properties. This is the conversion function.
    """
    return bin(dec)[2:].zfill(32)[::-1]


def get_tech_machine_learnset(m1, m2, m3, m4):
    learnset = [parse_tm_learnset_section(m) for m in (m1, m2, m3, m4)]
    learnset = [int(bit) for bits in learnset for bit in bits]

    can_learn = []
    for i, has_move in enumerate(learnset):
        if not has_move:
            continue

        tm = ItemTable['WazaMachine'][i]
        can_learn.append({'level': 'tm', 'moveId': tm['wazaNo']})

    return can_learn




def get_pokemon_learnset(monsno=0):
    """
    This function can be surprisingly heavy, so I added a cache.
    Returns a list of moves per ID
    """
    learnset = learnset_data['WazaOboe'][monsno]['ar']
    move_list = [{'level': learnset[i], 'moveId': learnset[i + 1]} for i in range(0, len(learnset), 2)]

    pokemon_learnset = {}
    for e in move_list:
        level = e['level']
        move_id = e['moveId']
        if move_id not in _move_properties_cache:
            _move_properties_cache[move_id] = get_move_properties(move_id)
        name = _move_properties_cache[move_id]['name']
        pokemon_learnset[name] = level

    return pokemon_learnset

def get_weight(monsno=0):
    """
    Returns the weight per the metric system
    """
    monsno = int(monsno)
    if monsno != 0:
        weightString = pkmn_weight_data['labelDataArray'][monsno]['wordDataArray'][0]['str'] if (pkmn_weight_data['labelDataArray'][monsno]['wordDataArray'][0] is not None) else '0'
        weightString = weightString.replace(u'\xa0', u' ')
        poundsString = weightString.split(u" ")[0]
        poundsString = poundsString.strip()
        pounds = float(poundsString)

        poundsInKilogram = pounds * 0.453592
        return round(poundsInKilogram, 2)
    else:
        return 0

def get_height(monsno=0):
    """
    Returns the Pokemon's height per the metric sytem.
    """
    monsno = int(monsno)
    if monsno != 0:
        height_string = pkmn_height_data['labelDataArray'][monsno]['wordDataArray'][0]['str'] or '0'
        feet_string, inches_string = height_string.split("'")
        inches = float(inches_string[:-1])
        feet = int(feet_string)

        feet_in_centimeters = feet * 30.48
        inches_in_centimeters = inches * 2.54
        return round((feet_in_centimeters + inches_in_centimeters) / 100, 2)
    else:
        return 0

def get_grass_knot_power(weightkg):
    """
    Allows you to display Grass Knot's Power on a certain Pokemon, because let's be real, no one really knows how much this move is going to do otherwise.
    """
    if weightkg >= 200:
        return 120
    elif weightkg >= 100:
        return 100
    elif weightkg >= 50:
        return 80
    elif weightkg >= 25:
        return 60
    elif weightkg >= 10:
        return 40
    else:
        return 20

def slugify(value):
    """
    Converts to lowercase, removes non-word characters (alphanumerics and
    underscores) and converts spaces to hyphens. Also strips leading and
    trailing whitespace.
    """
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub('[^\w\s-]', '', value).strip().lower()
    return re.sub('[-\s]+', '-', value)

def isSpecialPokemon(current_pokemon_name):
    """
    Returns true if the name of the Pokemon is Perrserker, Obstagoon, Indeedee, Meowstic or Sneasler.
    This is to retain intended behaviour the app depends on
    """
    return current_pokemon_name == "Perrserker" or current_pokemon_name == "Obstagoon" or current_pokemon_name == "Indeedee" or current_pokemon_name == "Meowstic" or current_pokemon_name == "Sneasler"

def create_diff_forms_dictionary(form_dict):
    """
    Each monsno will have an array of all the Pokemon names and forms.
    Add the current index to the name of the first object in the list as the key
    Find out why the number is what it is
    Add the current value as the second value in the array
    Add the slugged current value as the third value in the array
    """
    diff_forms = {}
    forms = GenForms()
    for mons_no in form_dict.keys():
        mons_array = form_dict[mons_no]
        current_pokemon_name = get_pokemon_name(int(mons_no))

        for (idx, mon) in enumerate(mons_array):
            if idx != 0 or isSpecialPokemon(current_pokemon_name):
                mon_zeros = 3 - len(str(mons_no))
                form_zeros = 3 - len(str(idx))
                if f"ZKN_FORM_{mon_zeros*'0'}{mons_no}_{form_zeros*'0'}{idx}" in forms.keys():
                    tracker_monsno = forms[f"ZKN_FORM_{mon_zeros*'0'}{mons_no}_{form_zeros*'0'}{idx}"]
                if isSpecialPokemon(current_pokemon_name):
                    tracker_monsno = int(mons_no)
                
                diff_forms[current_pokemon_name + (str(idx or 1)) ] = [tracker_monsno, mon, slugify(mon)]
    return diff_forms


def get_pokemon_info(personalId=0):
    """
    BDSP works on an ID system, thus it is imperative to be able to swap between monsno and "ID", which is the index of the Pokemon in any of the relevant Pokemon gamefiles. 
    """
    p = personal_data['Personal'][int(personalId)]

    info_dict = {
        'id': p['id'],
        'monsno': p['monsno'],
        'name': get_pokemon_name(int(personalId)),
        'ability1': get_ability_string(p['tokusei1']),
        'ability2': get_ability_string(p['tokusei2']),
        'abilityH': get_ability_string(p['tokusei3']),
        'learnset': get_pokemon_learnset(int(personalId)),
        'tmLearnset': get_tech_machine_learnset(p['machine1'], p['machine2'], p['machine3'], p['machine4']),
        'eggLearnset': get_egg_moves(int(personalId)),
        'baseStats': {
            'hp': p['basic_hp'], 'atk': p['basic_atk'], 'def': p['basic_def'], 
            'spa': p['basic_spatk'], 'spd': p['basic_spdef'], 'spe': p['basic_agi']
        },
        'baseStatsTotal': p['basic_hp'] + p['basic_atk'] + p['basic_def'] + p['basic_spatk'] + p['basic_spdef'] + p['basic_agi'],
        'weight': get_weight(personalId),
        'height': get_height(personalId),
        'grassKnotPower': get_grass_knot_power(get_weight(personalId)),
        'type': get_type_name(p['type1'])
    }
                
    if p['type2'] != p['type1']:
        info_dict['dualtype'] = get_type_name(p['type2'])
    else:
        info_dict['dualtype'] = 0
    return info_dict

def GenForms():
    forms_list = form_namedata["labelDataArray"]
    forms = {}
    for all_forms in forms_list:
        if all_forms["arrayIndex"] != 0 and int(all_forms["labelName"][-3:]) > 000:
            forms[all_forms["labelName"]] = all_forms["arrayIndex"]
    return forms
