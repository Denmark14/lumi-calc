import os
import json
from pokemonUtils import get_pokemon_name, get_types, make_ability_object, get_gender, get_form_name

parent_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
personal_data_file_path = os.path.join(parent_file_path, 'input', 'PersonalTable.json')
output_file_path = os.path.join(parent_file_path, 'output', 'LumiMons_Py.json')

with open(personal_data_file_path, 'r') as f:
    personal_data = json.load(f)

species_data = {}

def get_base_stats(pkmn):
    return {
        'hp': pkmn['basic_hp'],
        'at': pkmn['basic_atk'],
        'df': pkmn['basic_def'],
        'sa': pkmn['basic_spatk'],
        'sd': pkmn['basic_spdef'],
        'sp': pkmn['basic_agi']
    }

for index, current_pokemon in enumerate(personal_data['Personal']):
    if index == 0:
        continue
    
    form_index = current_pokemon['form_index']
    monsno = current_pokemon['monsno']
    name = get_pokemon_name(monsno)
    
    if form_index == 0 or current_pokemon['id'] == monsno:
        species_data[name] = {
            'types': get_types(current_pokemon),
            'bs': get_base_stats(current_pokemon),
            'weightkg': current_pokemon['weight'] / 10,
            'abilities': make_ability_object(current_pokemon['tokusei3'])
        }
        
        gender = get_gender(current_pokemon['sex'])
        if gender:
            species_data[name]['gender'] = gender
    
    else:
        form_name = get_form_name(index)
        
        if not form_name:
            print(f'Form Error: {index}, {form_name}, {name}')
        
        if 'otherFormes' not in species_data[name]:
            species_data[name]['otherFormes'] = []
            
        species_data[name]['otherFormes'].append(form_name)
        
        species_data[form_name] = {
            'types': get_types(current_pokemon),
            'bs': get_base_stats(current_pokemon),
            'weightkg': current_pokemon['weight'] / 10,
            'abilities': make_ability_object(current_pokemon['tokusei3']),
            'baseSpecies': name
        }
        
        gender = get_gender(current_pokemon['sex'])
        if gender:
            species_data[form_name]['gender'] = gender

import os
import json

def create_species_file(lumi_mons):
    species_file_path = os.path.join(os.path.dirname(__file__), 'species.txt')
    with open(species_file_path, 'r', encoding='utf-8') as f:
        species_file = f.read()

    special_line = 'const SS_PATCH: {[name: string]: DeepPartial<SpeciesData>} = '
    start_index = species_file.index(special_line)
    end_index = start_index + len(special_line)
    new_file = f'{species_file[:end_index]}{json.dumps(lumi_mons, indent=2)};{species_file[end_index:]}'
    species_file_path = os.path.join(parent_file_path, 'calc', 'src', 'data')
    with open(os.path.join(species_file_path, 'species.ts'), 'w', encoding='utf-8') as f:
        f.write(new_file)

def writeLumiMonsFile(speciesData):
    with open(output_file_path, 'w') as f:
        json.dump(speciesData, f, separators=(',', ':'))