""" Runner/main file for the Visualizer """
import os 
import json

from flask import Flask, render_template, request, jsonify
from api_helpers import *

app = Flask(__name__)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/api/get_data/', methods=['POST'])
def get_data():
    ## Hack to get this working
    temp = dict(request.form)

    req_dict = json.loads(list(temp.keys())[0])
    month_list = req_dict.get("month_list", [])
    alpha_flag = req_dict.get("alpha_flag")
    suspect_flag = req_dict.get("suspect_flag")
    gen = req_dict.get("gen")
    tier = req_dict.get("tier")
    level = req_dict.get("level")

    pokemon_data = {}


    for ind in range(len(month_list)):
        month_url = month_list[ind]
        month_name = month_url.replace("http://www.smogon.com/stats/", "")
        pokemon_data[month_name] = {}

        file_name = file_in_month(month_url, gen, tier, level, alpha_flag, suspect_flag)
        if file_name is not None:
            file_url = month_url + "/" + file_name + ".txt"
            print("Pulling", file_url)
            pokemon_data[month_name] = parse_data(file_url)
        
    return jsonify(pokemon_data)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
