import csv
from decimal import Decimal, getcontext

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

#def check_csv_info_column(infos):
#    total_lines = len(infos)
#    lines_with_pf = 0
#    lines_with_pj = 0

#    for elem in infos:
#        if 'pf' in elem:
#            lines_with_pf += 1
        
#        if 'pj' in elem:
#            lines_with_pj += 1
    
#    print(f"total_lines: {total_lines}, lines_with_pf : {lines_with_pf}, lines_with_pj: {lines_with_pj}")
#    print(f"sum of lines with pf and pj: {lines_with_pf + lines_with_pj}")
#    print(f"lines without classification: {total_lines - (lines_with_pf + lines_with_pj)}")

def get_credito_contratacao_data_per_state(infos, values):
    values_per_state = dict()
    for idx, info in enumerate(infos):
        if not info.startswith('credito_contratacao_contratado_pf'):
            continue

        info_splited = info.split('_')
        state = info_splited[-1]
        linha_credito = info_splited[-2]
        value = values[idx]

        if state not in values_per_state:
            values_per_state[f'{state}'] = dict()
        
        if linha_credito not in values_per_state[f'{state}']:
            values_per_state[f'{state}'][f'{linha_credito}'] = dict()

        values_per_state[f'{state}'][f'{linha_credito}'] = Decimal(value.replace(',', '.'))
    
    return values_per_state

def main():
    dates, infos, values = extract_data_from_csv()
    data = get_credito_contratacao_data_per_state(infos, values)
    print(data['sp'], data.keys())

if __name__ == '__main__':
    main()