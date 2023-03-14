import hashlib
import json
import os

parent_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
js_file_path = os.path.join(parent_file_path, 'output', 'LumiMons.json')
py_file_path = os.path.join(parent_file_path, 'output', 'LumiMons_Py.json')

def compare_json_files(file_path1, file_path2):
    with open(file_path1, 'r') as file1, open(file_path2, 'r') as file2:
        json_data1 = json.load(file1)
        json_data2 = json.load(file2)

        # Generate hash for first file
        hasher1 = hashlib.sha256()
        hasher1.update(json.dumps(json_data1).encode('utf-8'))
        hash1 = hasher1.hexdigest()

        # Generate hash for second file
        hasher2 = hashlib.sha256()
        hasher2.update(json.dumps(json_data2).encode('utf-8'))
        hash2 = hasher2.hexdigest()

        if hash1 == hash2:
            print("The JSON files are identical.")
        else:
            print("The JSON files are different.")

def diff_json(json1, json2):
    """
    Finds differences between two JSON objects with the same structure.

    Args:
    - json1: a JSON object
    - json2: another JSON object with the same structure as json1

    Returns:
    - A dictionary containing all differences found, organized by nested keys in the JSON objects.
    """
    diffs = {}

    # Check for keys in json1 that are missing from json2
    for key in json1:
        if key not in json2:
            diffs[key] = {
                'old': json1[key],
                'new': None
            }

    # Check for keys in json2 that are missing from json1
    for key in json2:
        if key not in json1:
            diffs[key] = {
                'old': None,
                'new': json2[key]
            }

    # Check for keys that are present in both objects
    for key in json1.keys() & json2.keys():
        if isinstance(json1[key], dict) and isinstance(json2[key], dict):
            # Recursively check nested objects
            nested_diffs = diff_json(json1[key], json2[key])
            if nested_diffs:
                diffs[key] = nested_diffs
        elif json1[key] != json2[key]:
            # Add differences at the current level
            diffs[key] = {
                'old': json1[key],
                'new': json2[key]
            }

    return diffs


def find_differences(file1_path, file2_path):
    with open(file1_path, 'r') as file1, open(file2_path, 'r') as file2:
        json1 = json.load(file1)
        json2 = json.load(file2)
        changes = diff_json(json1, json2)
        if len(changes) == 0:
            print("Whitespace differences only.")
        else:
            for key, value in changes.items():
                print(key, value)



compare_json_files(js_file_path, py_file_path)
find_differences(js_file_path, py_file_path)