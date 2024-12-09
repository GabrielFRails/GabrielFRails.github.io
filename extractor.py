import csv
import json
from decimal import Decimal, getcontext
from pprint import pprint

# precisao
getcontext().prec = 50

def extract_data_from_csv():
    dates = list()
    infos = list()
    values = list()

    with open('./data/mercadoimobiliario.csv', newline='', encoding='utf-8') as mifile:
        csv_reader = csv.reader(mifile)
        next(csv_reader, None) # pula a primeira linha

        for line in csv_reader:
            date = line[0]
            info = line[1]
            value = line[2]

            dates.append(date)
            infos.append(info)
            values.append(value)
    
    return dates, infos, values

def get_periodo_pandemico(date):
    year = int(date.split('-')[0])
    if year < 2020:
        return 'pre_pandemia'
    if year > 2019 and year < 2023:
        return 'pandemia'
    if year > 2022:
        return 'pos_pandemia'

def get_credito_contratacao_data_per_state(dates, infos, values):
    values_per_state = dict()
    for idx, info in enumerate(infos):
        if not info.startswith('credito_contratacao_contratado_pf'):
            continue

        info_splited = info.split('_')
        state = info_splited[-1]
        linha_credito = info_splited[-2]
        value = values[idx]
        date = dates[idx]

        if state not in values_per_state:
            values_per_state[state] = dict()
        
        # pré pandemia < 2020 | pandemia 2020/2022 | pós pandemia > 2022
        periodo = get_periodo_pandemico(date)
        if periodo not in values_per_state[f'{state}']:
            values_per_state[state][periodo] = dict()
        
        if linha_credito not in values_per_state[state][periodo]:
            values_per_state[state][periodo][linha_credito] = dict()
            values_per_state[state][periodo][linha_credito] = float(Decimal(value.replace(',', '.')))
            continue

        values_per_state[state][periodo][linha_credito] += float(Decimal(value.replace(',', '.')))
    
    return values_per_state

def main():
    dates, infos, values = extract_data_from_csv()
    data = get_credito_contratacao_data_per_state(dates, infos, values)
    #print("dados de sp")
    #pprint(data['sp'], indent=2)

    with open('./visualization/v.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

if __name__ == '__main__':
    main()