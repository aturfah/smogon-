tier_config = {
    "gen1": {
        "tiers": ["ou"]
    },
    "gen2": {
        "tiers": ["ou"]
    },
    "gen3": {
        "tiers": ["ou", "ubers"]
    },
    "gen4": {
        "tiers": ["ou", "uu", "ubers", "lc"]
    },
    "gen5": {
        "tiers": ["ou", "uu", "ru", "nu", "ubers"]
    },
    "gen6": {
        "prefix": false,
        "tiers": ["ou", "uu", "ru", "nu", "pu", "ubers"]
    },
    "gen7": {
        "tiers": ["ou", "uu", "ru", "nu", "pu", "ubers"]
    }
}

month_list = [
    '2014-11', '2014-12',
    '2015-01', '2015-02', '2015-03', '2015-04', '2015-05', '2015-06', '2015-07', '2015-08', '2015-09', '2015-10', '2015-11', '2015-12',
    '2016-01', '2016-02', '2016-03', '2016-04', '2016-05', '2016-06', '2016-07', '2016-08', '2016-09', '2016-10', '2016-11', '2016-12',
    '2017-01', '2017-02', '2017-03', '2017-04', '2017-05', '2017-06', '2017-07', '2017-08'
]

ou_mapping = {
    "0": "0",
    "1500": "1500",
    "1630": "1695",
    "1760": "1825"
}

mod_list = ['alpha', 'beta', 'suspecttest']

gl_gen = ""
gl_tier = ""
gl_level = ""

usage_data = {}
moveset_data = {}
pokemon_set = new Set()

color_wheel = [
    'rgb(255, 0, 0)',
    'rgb(0, 255, 0)',
    'rgb(0, 0, 255)'

]

$(document).ready(function () {
    load_months()
})

function load_months() {
    start_html_str = "<option>(From Start)</option>"
    end_html_str = "<option>(To End)</option>"
    for (month_ind = 0; month_ind < month_list.length; ++month_ind) {
        start_html_str += "<option>" + month_list[month_ind] + "</option>"
        end_html_str += "<option>" + month_list[month_ind] + "</option>"
    }
    $("#sel_start_month").html(start_html_str)
    $("#sel_end_month").html(end_html_str)
}

function load_list() {
    html_str = ""
    for (var i = 1; i < 4; ++i) {
        html_str += "Pokemon #" + i + ": <input class=\"mon_list\" id=\"mon_list_" + i + "\" list=\"valid_pokemon\" /><br />"
    }
    html_str += "<datalist id=\"valid_pokemon\">"

    mon_arr = Array.from(pokemon_set).sort();
    for (mon in mon_arr) {
        html_str += "<option value=\"" + mon_arr[mon] + "\">"
    }

    html_str += "</datalist><br/>\
        <div class=\"btn btn-primary submit-button\" onclick=\"graph_data()\">Graph</div>"
    $("#pokemon_select").html(html_str)
}

function get_data() {
    usage_data = {}
    pokemon_set.clear()
    refresh_graph()
    $('#pokemon_select').collapse({
        toggle: true
    });
    $("#pokemon_select").html("<img src=\"/static/hourglass.gif\" style=\"width:40px;margin:auto;display:block;\" alt=\"Loading...\"/>")

    var base_url = "http://www.smogon.com/stats/"
    var gen = document.getElementById("sel_gen").value.toLowerCase();
    var tier = document.getElementById("sel_tier").value.toLowerCase();
    var level = document.getElementById("sel_level").value.toLowerCase();
    var alpha_beta = !$('#alpha_checkbox').is(":checked");
    var suspect = !$('#suspect_checkbox').is(":checked");

    if (tier == "ou" && (gen == "gen6" || gen == "gen7")) {
        level = ou_mapping[level]
    }

    gl_gen = gen
    gl_tier = tier
    gl_level = level

    //Invalid tier choice
    if ($.inArray(tier, tier_config[gen]["tiers"]) == -1) {
        alert_message = "Bad tier choice, " + gen + " only supports"
        for (i = 0; i < tier_config[gen]["tiers"].length; ++i) {
            alert_message += " " + tier_config[gen]["tiers"][i]
        }
        alert(alert_message)
        return
    }

    month_url_list = []
    start_month = document.getElementById("sel_start_month").value
    end_month = document.getElementById("sel_end_month").value
    if (start_month == "(From Start)") {
        start_month = 0;
    } else {
        start_month = $.inArray(start_month, month_list)
    }
    if (end_month == "(To End)") {
        end_month = month_list.length
    } else {
        end_month = $.inArray(end_month, month_list) + 1
    }

    if (end_month < start_month) {
        alert("Starting Month is after Ending Month!")
        return
    }

    for (month_ind = start_month; month_ind < end_month; ++month_ind) {
        month_url = base_url + month_list[month_ind]
        month_url_list.push(month_url)
    }

    request_data = {
        "gen": gen,
        "tier": tier,
        "level": level,
        'month_list': month_url_list,
        'alpha_flag': alpha_beta,
        'suspect_flag': suspect
    }
    
    get_moveset_data(request_data)
    get_usage_data(request_data)
    return;
}

function get_usage_data(request_data){
    $.ajax({
        'type': "POST",
        'url': "/api/get_data/",
        'data': request_data,
        'dataType': "json",
        'success': function (data) {
            usage_data = data
            for (month in usage_data) {
                for (pokemon in usage_data[month]) {
                    pokemon_set.add(pokemon)
                }
            }
            load_list()
        }
    });
}

function get_moveset_data(request_data) {
    $.ajax({
        'type': "POST",
        'url': "/api/get_moveset_data/",
        'data': request_data,
        'dataType': "json",
        'success': function (data) {
            console.log(moveset_data)
            moveset_data = data
        }
    });
}

function graph_data() {
    pokemon_1 = document.getElementById("mon_list_1").value
    pokemon_2 = document.getElementById("mon_list_2").value
    pokemon_3 = document.getElementById("mon_list_3").value

    if (pokemon_1 == "" && pokemon_2 == "" && pokemon_3 == "") {
        alert("You must select at least one pokemon");
        return
    }

    mon_list = []
    if (pokemon_set.has(pokemon_1)) {
        mon_list.push(pokemon_1)
    }
    if (pokemon_set.has(pokemon_2)) {
        mon_list.push(pokemon_2)
    }
    if (pokemon_set.has(pokemon_3)) {
        mon_list.push(pokemon_3)
    }

    if (mon_list.length == 0) {
        alert("No pokemon provided matches the list.\n\
            Make sure to use the exact spelling from the dropdown.");
        return
    }


    mon_data = {}
    mon_data['months'] = []
    mon_data['pokemon'] = {}
    for (mon_ind in mon_list) {
        mon_name = mon_list[mon_ind]
        mon_data['pokemon'][mon_name] = {}
        mon_data['pokemon'][mon_name]['usage'] = {}
        mon_data['pokemon'][mon_name]['rank'] = {}
    }
    for (month in usage_data) {
        mon_data['months'].push(month)
        for (mon_ind in mon_list) {
            mon_name = mon_list[mon_ind]
            if (usage_data[month].hasOwnProperty(mon_name)) {
                mon_data['pokemon'][mon_name]['usage'][month] = parseFloat(usage_data[month][mon_name]['usage'])
                mon_data['pokemon'][mon_name]['rank'][month] = parseInt(usage_data[month][mon_name]['rank'])
            } else {
                mon_data['pokemon'][mon_name]['usage'][month] = null
                mon_data['pokemon'][mon_name]['rank'][month] = null
            }
        }
    }
    display_graph(mon_data)
}

function display_graph(mon_data) {
    //Graphs go here!!!
    $("#datadiv").html("<canvas id=\"myChart\"></canvas><div id=\"movesetdiv\"></div>")
    title_str = gl_gen + " " + gl_tier + "-" + gl_level + " Usage% for "

    chart_data = {}
    chart_data['labels'] = mon_data['months'].sort()
    chart_data['datasets'] = []

    for (pokemon_name in mon_data['pokemon']) {
        title_str += pokemon_name + ", "
        dataset = {}
        dataset['label'] = pokemon_name
        dataset['data'] = []
        dataset['borderColor'] = color_wheel[chart_data['datasets'].length]
        for (month_key in mon_data['months']) {
            month_name = mon_data['months'][month_key]
            dataset['data'].push(mon_data['pokemon'][pokemon_name]['usage'][month_name])
        }

        chart_data['datasets'].push(dataset)
    }
    title_str = title_str.slice(0, -2) + " from " + chart_data['labels'][0] + " to " + chart_data['labels'][chart_data['labels'].length - 1]

    var ctx = document.getElementById('myChart').getContext('2d');
    var chart = new Chart(ctx, {
        // The type of chart we want to create
        'type': 'line',
        'data': chart_data,
        // Configuration options go here
        'options': {
            'fill': false,
            //Display legend on the right
            'legend': {
                'display': true,
                'position': 'right',
            },
            //Display the Title
            'title': {
                'text': title_str,
                'display': true
            }
        }
    });
}

function unshow() {
    $('#specifications').removeClass("show");
}

function refresh_graph() {
    $("#datadiv").html("[graph goes here]")
}