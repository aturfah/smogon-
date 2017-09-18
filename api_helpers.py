from urllib.request import urlopen 
from re import sub, findall

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
        print("Filename not found: ", filename)
        return None

def parse_moveset_data(file_url):
    file_data = {}
    txt_data = urlopen(file_url).read().decode()

    pct_regex = "[0-9]{1,3}\.[0-9]+?%"
    split_str = " +----------------------------------------+ \n"

    data_arr = txt_data.split(split_str + split_str)

    for datum in data_arr:
        datum_arr = datum.split(split_str)

        #Process the name
        name = datum_arr[0]
        name = name.replace("|", "").strip()
        file_data[name] = {}
        #Process the moves
        moves = None
        for section in datum_arr:
            #Find the moves section
            if "Moves" in section:
                moves = section
                break
        if moves is None:
            #No moves data found
            continue

        moves = moves.replace("|", "")
        moves_arr = moves.split("\n")
        for move_ in moves_arr:
            move = move_.strip()
            if move == "Moves" or move == "":
                continue
            elif "Teammates" in move:
                break
            pct_val = findall(pct_regex, move)[0]
            move = move.replace(pct_val, "").strip()
            pct_val = float(pct_val.replace("%", ""))
            #print("\t{} {}".format(move, pct_val))
            file_data[name][move] = pct_val

    return file_data

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