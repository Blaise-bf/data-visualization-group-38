import json
import random

# Define the years, areas, and business units
years = list(range(2019, 2024))
areas = ["Overall", "North", "South", "West", "East", "Underdark"]
business_units = ["Adventuring", "Commissions", "Luxury specialities"]

# Generate random data
data = []
for year in years:
    for week in range(1, 53):  # Assuming 52 weeks in a year
        for area in areas:
            for business_unit in business_units:
                total_customers = random.randint(10, 100)
                entry = {
                    "year": year,
                    "week": f"Week {week}",
                    "area": area,
                    "business_unit": business_unit,
                    "totalCustomers": total_customers
                }
                data.append(entry)

# Write the data to a JSON file
with open("tmpdata.json", "w") as json_file:
    json.dump(data, json_file, indent=4)
