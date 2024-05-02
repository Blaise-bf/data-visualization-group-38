import pandas as pd
from mlxtend.frequent_patterns import apriori
from mlxtend.frequent_patterns import association_rules

def clean_df(df_in):

    df_tmp = df_in.copy()

    df_tmp['productsIDs'] = df_tmp['productsIDs'].str.split(', ')
    df_tmp['Quantities'] = df_tmp['Quantities'].str.split(', ')
    df_tmp['ProductPricesInCP'] = df_tmp['ProductPricesInCP'].str.split(', ')

    # Initialize an empty list to store the new rows
    new_rows = []

    # Iterate over each row in the dataframe
    for _, row in df_tmp.iterrows():
        # Match corresponding elements from each list and create new rows
        for product_id, quantity, price in zip(row['productsIDs'], row['Quantities'], row['ProductPricesInCP']):
            new_rows.append([row['OrderID'], row['Area'], product_id, quantity, price])

    # Create a new dataframe from the list of new rows
    df_expanded = pd.DataFrame(new_rows, columns=['OrderID', 'Area', 'productsIDs', 'Quantities', 'ProductPricesInCP'])

    df_expanded['Quantities'] = df_expanded['Quantities'].astype(int)
    df_expanded['ProductPricesInCP'] = df_expanded['ProductPricesInCP'].astype(float)

    df_expanded['Value'] = round(df_expanded['Quantities']*df_expanded['ProductPricesInCP']/100,0)
    df_expanded['Value'] = df_expanded['Value'].astype(int)

    most_bought_products = df_expanded[['productsIDs', 'Value']].groupby(['productsIDs'], as_index=False).sum()

    most_bought_products = most_bought_products.sort_values('Value', ascending=False)

    top_three_products = most_bought_products.head(3).reset_index(drop=True)

    relevant_orders = df_expanded[df_expanded['productsIDs'].isin(top_three_products['productsIDs'])]

    df_out = df_expanded[df_expanded['OrderID'].isin(relevant_orders['OrderID'])]

    return df_out, top_three_products

def market_basket_analysis(df_in, support_in, items_in):

    basket = df_in.pivot_table(index="OrderID", columns="productsIDs", values='Quantities', aggfunc="sum",fill_value=0)

    def encode_units(x):
        if x <= 0:
            return 0
        if x >= 1:
            return 1

    basket_sets = basket.applymap(encode_units)

    frequent_itemsets = apriori(basket_sets, min_support=support_in, use_colnames=True)

    rules = association_rules(frequent_itemsets, metric='lift', min_threshold=1)

    rules["antecedents"] = rules["antecedents"].apply(lambda x: list(x)[0]).astype("unicode")
    rules["consequents"] = rules["consequents"].apply(lambda x: list(x)[0]).astype("unicode")

    rules = rules[rules['antecedents'].str.contains('|'.join(items_in))]

    max_support_indices = rules.groupby('antecedents')['support'].nlargest(2).reset_index()['level_1']

    first_two_indices = max_support_indices.groupby(max_support_indices.index).head(2)
    
    products_out = rules.loc[first_two_indices]

    products_out = products_out[['antecedents', 'consequents']].reset_index(drop=True)

    products_out = products_out.groupby('antecedents')['consequents'].apply(lambda x: pd.Series(x.values)).unstack().reset_index()

    products_out.columns = ['antecedent_id', 'consequent_id_1', 'consequent_id_2']

    return products_out

orders_df = pd.read_csv('data/orders.csv')
regions_df = pd.read_csv('data/regions.csv')
products_df = pd.read_csv('data/products.csv')

orders_df = orders_df[['OrderID', 'Territory', 'Products', 'productsIDs', 'Quantities', 'ProductPricesInCP']]
regions_df = regions_df[['Territory', 'Area']]
products_df = products_df[['product_code', 'Product Name', 'Brand Name']]
products_df.loc[products_df['Brand Name'] != 'U.N.N.', 'Brand Name'] = products_df.loc[products_df['Brand Name'] != 'U.N.N.', 'Brand Name'].str.title()

merged_df = pd.merge(orders_df, regions_df, on='Territory', how='left')

north_df = merged_df[merged_df['Area'] == 'North']
east_df = merged_df[merged_df['Area'] == 'East']
south_df = merged_df[merged_df['Area'] == 'South']
west_df = merged_df[merged_df['Area'] == 'West']
underdark_df = merged_df[merged_df['Area'] == 'Underdark']

north_clean_df, north_top_three = clean_df(north_df)
north_top_three_ids = north_top_three['productsIDs'].iloc[:3].tolist()
east_clean_df, east_top_three = clean_df(east_df)
east_top_three_ids = east_top_three['productsIDs'].iloc[:3].tolist()
south_clean_df, south_top_three = clean_df(south_df)
south_top_three_ids = south_top_three['productsIDs'].iloc[:3].tolist()
west_clean_df, west_top_three = clean_df(west_df)
west_top_three_ids = west_top_three['productsIDs'].iloc[:3].tolist()
underdark_clean_df, underdark_top_three = clean_df(underdark_df)
underdark_top_three_ids = underdark_top_three['productsIDs'].iloc[:3].tolist()

print(f'The most frequent items for the northern area are:\n {north_top_three}\n')
print(f'The most frequent items for the eastern area are:\n {east_top_three}\n')
print(f'The most frequent items for the southern area are:\n {south_top_three}\n')
print(f'The most frequent items for the western area are:\n {west_top_three}\n')
print(f'The most frequent items for the underdark area are:\n {underdark_top_three}\n')

north_products = market_basket_analysis(north_clean_df, 0.05, north_top_three_ids)
east_products = market_basket_analysis(east_clean_df, 0.05, east_top_three_ids)
south_products = market_basket_analysis(south_clean_df, 0.05, south_top_three_ids)
west_products = market_basket_analysis(west_clean_df, 0.05, west_top_three_ids)
underdark_products = market_basket_analysis(underdark_clean_df, 0.05, underdark_top_three_ids)

north_top_three.columns = ['antecedent_id', 'value']
north_products = pd.merge(north_products, north_top_three, on='antecedent_id', how='left')
products_df['product_code'] = products_df['product_code'].astype(str)
north_products = pd.merge(north_products, products_df, left_on='antecedent_id', right_on='product_code', how='left')
north_products = north_products.rename(columns={'Product Name': 'antecedent_label', 'Brand Name': 'antecedent_brand'}).drop(columns='product_code')
north_products = pd.merge(north_products, products_df, left_on='consequent_id_1', right_on='product_code', how='left')
north_products = north_products.rename(columns={'Product Name': 'consequent_label_1', 'Brand Name': 'consequent_brand_1'}).drop(columns='product_code')
north_products = pd.merge(north_products, products_df, left_on='consequent_id_2', right_on='product_code', how='left')
north_products = north_products.rename(columns={'Product Name': 'consequent_label_2', 'Brand Name': 'consequent_brand_2'}).drop(columns='product_code')
north_products['antecedent_name'] = north_products['antecedent_label'] + ' (' + north_products['antecedent_brand'] + ')'
north_products['consequent_name_1'] = north_products['consequent_label_1'] + ' (' + north_products['consequent_brand_1'] + ')'
north_products['consequent_name_2'] = north_products['consequent_label_2'] + ' (' + north_products['consequent_brand_2'] + ')'
north_products_final = north_products[['antecedent_name','value', 'consequent_name_1', 'consequent_name_2']]
north_products_final['Area'] = 'North'

east_top_three.columns = ['antecedent_id', 'value']
east_products = pd.merge(east_products, east_top_three, on='antecedent_id', how='left')
products_df['product_code'] = products_df['product_code'].astype(str)
east_products = pd.merge(east_products, products_df, left_on='antecedent_id', right_on='product_code', how='left')
east_products = east_products.rename(columns={'Product Name': 'antecedent_label', 'Brand Name': 'antecedent_brand'}).drop(columns='product_code')
east_products = pd.merge(east_products, products_df, left_on='consequent_id_1', right_on='product_code', how='left')
east_products = east_products.rename(columns={'Product Name': 'consequent_label_1', 'Brand Name': 'consequent_brand_1'}).drop(columns='product_code')
east_products = pd.merge(east_products, products_df, left_on='consequent_id_2', right_on='product_code', how='left')
east_products = east_products.rename(columns={'Product Name': 'consequent_label_2', 'Brand Name': 'consequent_brand_2'}).drop(columns='product_code')
east_products['antecedent_name'] = east_products['antecedent_label'] + ' (' + east_products['antecedent_brand'] + ')'
east_products['consequent_name_1'] = east_products['consequent_label_1'] + ' (' + east_products['consequent_brand_1'] + ')'
east_products['consequent_name_2'] = east_products['consequent_label_2'] + ' (' + east_products['consequent_brand_2'] + ')'
east_products_final = east_products[['antecedent_name','value', 'consequent_name_1', 'consequent_name_2']]
east_products_final['Area'] = 'East'

south_top_three.columns = ['antecedent_id', 'value']
south_products = pd.merge(south_products, south_top_three, on='antecedent_id', how='left')
products_df['product_code'] = products_df['product_code'].astype(str)
south_products = pd.merge(south_products, products_df, left_on='antecedent_id', right_on='product_code', how='left')
south_products = south_products.rename(columns={'Product Name': 'antecedent_label', 'Brand Name': 'antecedent_brand'}).drop(columns='product_code')
south_products = pd.merge(south_products, products_df, left_on='consequent_id_1', right_on='product_code', how='left')
south_products = south_products.rename(columns={'Product Name': 'consequent_label_1', 'Brand Name': 'consequent_brand_1'}).drop(columns='product_code')
south_products = pd.merge(south_products, products_df, left_on='consequent_id_2', right_on='product_code', how='left')
south_products = south_products.rename(columns={'Product Name': 'consequent_label_2', 'Brand Name': 'consequent_brand_2'}).drop(columns='product_code')
south_products['antecedent_name'] = south_products['antecedent_label'] + ' (' + south_products['antecedent_brand'] + ')'
south_products['consequent_name_1'] = south_products['consequent_label_1'] + ' (' + south_products['consequent_brand_1'] + ')'
south_products['consequent_name_2'] = south_products['consequent_label_2'] + ' (' + south_products['consequent_brand_2'] + ')'
south_products_final = south_products[['antecedent_name','value', 'consequent_name_1', 'consequent_name_2']]
south_products_final['Area'] = 'South'

west_top_three.columns = ['antecedent_id', 'value']
west_products = pd.merge(west_products, west_top_three, on='antecedent_id', how='left')
products_df['product_code'] = products_df['product_code'].astype(str)
west_products = pd.merge(west_products, products_df, left_on='antecedent_id', right_on='product_code', how='left')
west_products = west_products.rename(columns={'Product Name': 'antecedent_label', 'Brand Name': 'antecedent_brand'}).drop(columns='product_code')
west_products = pd.merge(west_products, products_df, left_on='consequent_id_1', right_on='product_code', how='left')
west_products = west_products.rename(columns={'Product Name': 'consequent_label_1', 'Brand Name': 'consequent_brand_1'}).drop(columns='product_code')
west_products = pd.merge(west_products, products_df, left_on='consequent_id_2', right_on='product_code', how='left')
west_products = west_products.rename(columns={'Product Name': 'consequent_label_2', 'Brand Name': 'consequent_brand_2'}).drop(columns='product_code')
west_products['antecedent_name'] = west_products['antecedent_label'] + ' (' + west_products['antecedent_brand'] + ')'
west_products['consequent_name_1'] = west_products['consequent_label_1'] + ' (' + west_products['consequent_brand_1'] + ')'
west_products['consequent_name_2'] = west_products['consequent_label_2'] + ' (' + west_products['consequent_brand_2'] + ')'
west_products_final = west_products[['antecedent_name','value', 'consequent_name_1', 'consequent_name_2']]
west_products_final['Area'] = 'West'

underdark_top_three.columns = ['antecedent_id', 'value']
underdark_products = pd.merge(underdark_products, underdark_top_three, on='antecedent_id', how='left')
products_df['product_code'] = products_df['product_code'].astype(str)
underdark_products = pd.merge(underdark_products, products_df, left_on='antecedent_id', right_on='product_code', how='left')
underdark_products = underdark_products.rename(columns={'Product Name': 'antecedent_label', 'Brand Name': 'antecedent_brand'}).drop(columns='product_code')
underdark_products = pd.merge(underdark_products, products_df, left_on='consequent_id_1', right_on='product_code', how='left')
underdark_products = underdark_products.rename(columns={'Product Name': 'consequent_label_1', 'Brand Name': 'consequent_brand_1'}).drop(columns='product_code')
underdark_products = pd.merge(underdark_products, products_df, left_on='consequent_id_2', right_on='product_code', how='left')
underdark_products = underdark_products.rename(columns={'Product Name': 'consequent_label_2', 'Brand Name': 'consequent_brand_2'}).drop(columns='product_code')
underdark_products['antecedent_name'] = underdark_products['antecedent_label'] + ' (' + underdark_products['antecedent_brand'] + ')'
underdark_products['consequent_name_1'] = underdark_products['consequent_label_1'] + ' (' + underdark_products['consequent_brand_1'] + ')'
underdark_products['consequent_name_2'] = underdark_products['consequent_label_2'] + ' (' + underdark_products['consequent_brand_2'] + ')'
underdark_products_final = underdark_products[['antecedent_name','value', 'consequent_name_1', 'consequent_name_2']]
underdark_products_final['Area'] = 'Underdark'

products_final = pd.concat([north_products_final, east_products_final, south_products_final, west_products_final, underdark_products_final], ignore_index=True)

products_final.to_csv('data/products_basket_analysis.csv')