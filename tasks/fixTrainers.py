import json

# Load the original JSON file into a Python dictionary
with open('input/TrainerTable.json', 'r') as f:
    original_data = json.load(f)

# Load the new JSON file into a Python list
with open('output/NewTrainerTable.json', 'r') as f:
    new_data = json.load(f)

# Iterate over the objects in the new JSON array and find the corresponding object in the original JSON array
for new_obj in new_data:
    for i, orig_obj in enumerate(original_data['TrainerPoke']):
        if orig_obj['ID'] == new_obj['ID']:
            # Replace the object in the original JSON array with the new object
            original_data['TrainerPoke'][i] = new_obj
            break

# Save the updated dictionary back to the JSON file
with open('output/TrainerTable.json', 'w') as f:
    json.dump(original_data, f, indent=4)