import os
import json

parent_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
trainers_file_path = os.path.join(parent_file_path, 'input', 'english_dp_trainers_name.json')
areas_file_path = os.path.join(parent_file_path, 'input', 'areas.csv')
bdsp_location_files_path = os.path.join(parent_file_path, 'placedatas')
trainer_table_file_path = os.path.join(parent_file_path, 'input', 'TrainerTable.json')
trainer_labels_file_path = os.path.join(parent_file_path, 'input', 'english_dp_trainers_type.json')
bdsp_location_files = os.listdir(bdsp_location_files_path)
TRAINER_TABLE = 0
trainer_labels = 0
trainer_names = 0
areas = 0

with open(trainer_labels_file_path, 'r') as f:
    trainer_labels = json.load(f)

with open(trainer_table_file_path, 'r') as f:
    TRAINER_TABLE = json.load(f)

with open(trainers_file_path) as f:
    trainer_names = json.load(f)

with open(areas_file_path, encoding="utf-8") as f:
    areas = [line.strip().split(',') for line in f.readlines()]

def get_trainer_name(label_name):
    label_data_array = trainer_names['labelDataArray']
    match = next((e for e in label_data_array if e['labelName'] == label_name), None)
    return match['wordDataArray'][0]['str'] if match else None

def get_trainer_label(label_name):
    label_data_array = trainer_labels['labelDataArray']
    match = next((e for e in label_data_array if e['labelName'] == label_name), None)
    return match['wordDataArray'][0]['str'] if match else None

def get_trainer_data_from_place_datas():
    trainers = []
    for bdsp_location_file in bdsp_location_files:
        with open(os.path.join(parent_file_path, 'placedatas', bdsp_location_file), 'r') as f:
            data = json.load(f)
        for event in data['Data']:
            if event['TrainerID'] > 0 and event['TrainerID'] < 10000 and event['zoneID'] != -1:
                trainer_data = TRAINER_TABLE['TrainerData'][event['TrainerID']]
                trainer_type = TRAINER_TABLE['TrainerType'][trainer_data['TypeID']]
                trainer_label = get_trainer_label(trainer_type['LabelTrType'])
                trainer_name = get_trainer_name(trainer_data['NameLabel'])
                trainers.append({
                    'zoneName': areas[event['zoneID']],
                    'zoneId': event['zoneID'],
                    'trainerId': event['TrainerID'],
                    'rematch': 0,
                    'name': trainer_name,
                    'type': trainer_label
                })
    return trainers

def generate_trainer_name(raw_trainer_name, pokemon1_level):
    level = int(pokemon1_level)
    if level is None:
        return None

    i1 = raw_trainer_name.find('[')
    i2 = raw_trainer_name.find(']')

    bad_section = raw_trainer_name[i1:i2+1]
    is_boss_trainer = ('City' in bad_section or 'League' in bad_section)
    if not is_boss_trainer or 'Master' in raw_trainer_name:
        return raw_trainer_name

    trainer_substring = raw_trainer_name[:i1-1] + raw_trainer_name[i2+1:]
    if level == 100:
        return trainer_substring + ' Rematch'
    return trainer_substring