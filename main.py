import json
import os
from re import sub
from urllib.request import urlopen 

from flask import Flask, render_template, request, jsonify
from api_helpers import *

app = Flask(__name__)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/api/get_data/', methods=['POST'])
def get_data():
    req_dict = dict(request.form)
    month_list = req_dict.get("month_list[]")
    alpha_flag = req_dict.get("alpha_flag")[0] == 'true'
    suspect_flag = req_dict.get("suspect_flag")[0] == 'true'
    gen = req_dict.get("gen")[0]
    tier = req_dict.get("tier")[0]
    level = req_dict.get("level")[0]

    pokemon_data = {}

    for ind in range(len(month_list)):
        month_url = month_list[ind]
        month_name = month_url.replace("http://www.smogon.com/stats/", "")
        pokemon_data[month_name] = {}

        file_name = file_in_month(month_url, gen, tier, level, alpha_flag, suspect_flag)
        if file_name is not None:
            file_url = month_url + "/" + file_name + ".txt"
            print(file_url)
            pokemon_data[month_name] = parse_data(file_url)
        else:
            print("Filename not found")

    return jsonify(pokemon_data)

def file_in_month(month_url, gen, tier, level, alpha_flag, suspect_flag):
    raw_html = urlopen(month_url).read().decode()

    filename = gen + tier + "-" + level
    filename_gen6 = tier + "-" + level
    filename_suspect = gen + tier + "suspecttest-" + level
    filename_alpha = gen + tier + "alpha-" + level
    filename_beta = gen + tier + "beta-" + level

    if suspect_flag and '"' + filename_suspect in raw_html:
        return filename_suspect
    elif '"' + filename in raw_html:
        return filename
    elif alpha_flag and '"' + filename_alpha in raw_html:
        return filename_alpha
    elif alpha_flag and '"' + filename_beta in raw_html:
        return filename_beta
    elif gen == "gen6":
        return file_in_month(month_url, "", tier, level, alpha_flag, suspect_flag)
    else:
        return None

def parse_data(file_url):
    file_data = {}
    txt_data = urlopen(file_url).read().decode()

    data_arr = txt_data.split("\n")
    #Remove the header rows/not relevant rows
    to_delete = [0, 1]
    for i in range(len(data_arr)):
        if " + " in data_arr[i] or "| Rank" in data_arr[i]:
            to_delete.append(i)

    to_delete = list(reversed(to_delete))
    for delete_index in to_delete:
        del data_arr[delete_index]

    for row in data_arr:
        if row == "":
            continue

        datum = " " + row.strip() + " "
        datum = sub("[ ]{1,50}", " ", datum)
        datum_arr = datum.split(" | ")

        #Remove unneeded datapoints
        datum_arr = datum_arr[1:5] 
        rank = datum_arr[0]
        name = datum_arr[1]
        usage_pcnt = datum_arr[2]
        usage_count = datum_arr[3]
        file_data[name] = {}
        file_data[name]["rank"] = rank
        file_data[name]["usage"] = usage_pcnt
        file_data[name]['count'] = usage_count
    
    return file_data

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
