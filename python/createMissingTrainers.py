import os
import json
from trainerUtils import get_trainer_label, get_trainer_name, get_trainer_data_from_place_datas

parent_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
trainertable_file_path = os.path.join(parent_file_path, 'input', 'TrainerTable.json')

BDSP_Trainers = get_trainer_data_from_place_datas()
TRAINER_TABLE = {}

with open(trainertable_file_path, 'r') as f:
    TRAINER_TABLE = json.load(f)

def find_missing_trainers(trainers):
    arr = list(range(1, 2000))
    for trainer in trainers:
        try:
            arr.remove(trainer['trainerId'])
        except ValueError:
            pass

    volkners = []
    missing_trainers = []
    for element in arr:
        trainer_data = TRAINER_TABLE['TrainerData'][element]
        trainer_type = TRAINER_TABLE['TrainerType'][trainer_data['TypeID']]
        trainer_label = get_trainer_label(trainer_type['LabelTrType'])
        trainer_name = get_trainer_name(trainer_data['NameLabel'])

        if trainer_name == 'Volkner':
            # We extended the trainer by duplicating Volkner trainers, therefore any Volkners outside of the docs' specified IDs should be considered undefined trainers
            volkners.append({'trainerId': element, 'name': trainer_name, 'type': trainer_label})
        else:
            missing_trainers.append({'trainerId': element, 'name': trainer_name, 'type': trainer_label})

    return {'volkners': volkners, 'missingTrainers': missing_trainers}

result = find_missing_trainers(BDSP_Trainers)
with open(os.path.join(parent_file_path, 'output', 'missingTrainers.json'), 'w') as f:
    json.dump(result['missingTrainers'], f, indent=2)