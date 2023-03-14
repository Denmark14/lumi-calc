import os
import json

parent_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_monsname.json')
ability_namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_tokusei.json')
type_namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_typename.json')
forms_namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_zkn_form.json')
nature_namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_seikaku.json')
items_namedata_file_path = os.path.join(parent_file_path, 'input', 'english_ss_itemname.json')
smogon_movedata_file_path = os.path.join(parent_file_path, 'input', 'moves.json')
learnset_file_path = os.path.join(parent_file_path, 'input', 'WazaOboeTable.json')


move_enum = 0
name_data = 0
ability_namedata = 0
type_namedata = 0
form_namedata = 0
nature_namedata = 0
item_namedata = 0
SMOGON_MOVES = 0
learnset = 0

with open(namedata_file_path, 'r') as f:
    name_data = json.load(f)

with open(ability_namedata_file_path, 'r') as f:
    ability_namedata = json.load(f)

with open(type_namedata_file_path, 'r') as f:
    type_namedata = json.load(f)

with open(forms_namedata_file_path, 'r') as f:
    form_namedata = json.load(f)

with open(nature_namedata_file_path, 'r') as f:
    nature_namedata = json.load(f)

with open(items_namedata_file_path, 'r') as f:
    item_namedata = json.load(f)

with open(smogon_movedata_file_path, 'r') as f:
    SMOGON_MOVES = json.load(f)

with open(learnset_file_path, 'r') as f:
    learnset = json.load(f)

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

def get_pokemon_name(mons_no):
    try:
        pokemon_name = name_data["labelDataArray"][mons_no]["wordDataArray"][0]["str"]
        pokemon_name = pokemon_name.replace('♀', '-F')
        pokemon_name = pokemon_name.replace('♂', '-M')
        pokemon_name = pokemon_name.replace('’', '\u2019')
        return pokemon_name
    except Exception as e:
        print(mons_no, e)

def get_form_name(id):
    if id == 1131:
        return 'Ash-Greninja'
    elif id == 1174:
        return 'Meowstic-F'
    elif id == 1199:
        return 'Rockruff Own-Tempo'
    elif id == 1330:
        return 'Indeedee-F'
    elif id == 1343:
        return 'Basculegion-F'
    else:
        return form_namedata['labelDataArray'][id]['wordDataArray'][0]['str']
    
def get_item_string(item_id):
    return item_namedata["labelDataArray"][item_id]["wordDataArray"][0]["str"]

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
    ability_id = next((i for i, e in enumerate(ability_namedata.labelDataArray) if e['wordDataArray'][0]['str'] == ability_string), -1)
    return ability_id

def get_pokemon_mons_no_from_name(pokemon_name):
    if not pokemon_name:
        return -1
    mons_no = next((i for i, e in enumerate(name_data.labelDataArray) if e['wordDataArray'][0]['str'] == pokemon_name), -1)
    return mons_no

def get_nature_id(nature_string):
    if not nature_string:
        return -1
    nature_id = next((i for i, e in enumerate(nature_namedata.labelDataArray) if e['wordDataArray'][0]['str'] == nature_string), -1)
    return nature_id

def generate_moves_via_learnset(mons_no, level):
    moveset = learnset['WazaOboe'][mons_no]['ar']
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
