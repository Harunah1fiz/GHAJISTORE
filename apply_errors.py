import sys

file_path = r'c:\Users\HP\Desktop\shartApp\ghajiSale\templates\product\add_product.html'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_next = 0

for i, line in enumerate(lines):
    if skip_next > 0:
        skip_next -= 1
        continue
        
    new_lines.append(line)
    
    if '{{ product_form.name|add_class:"w-full border border-gray-300 rounded-md px-3 py-2"|attr:"id:product-name" }}' in line:
        new_lines.append('                                {% if product_form.name.errors %}<p class="text-red-500 text-xs italic mt-1">{{ product_form.name.errors.0 }}</p>{% endif %}\n')
    elif '{{ product_form.barcode|add_class:"w-full border border-gray-300 rounded-md px-3 py-2"|attr:"id:sku" }}' in line:
        new_lines.append('                                {% if product_form.barcode.errors %}<p class="text-red-500 text-xs italic mt-1">{{ product_form.barcode.errors.0 }}</p>{% endif %}\n')
    elif '{{ pricing_form.retail_price|add_class:"w-full border border-gray-300 rounded-md px-3 py-2"|attr:"id:selling_cost" }}' in line:
        new_lines.append('                                {% if pricing_form.retail_price.errors %}<p class="text-red-500 text-xs italic mt-1">{{ pricing_form.retail_price.errors.0 }}</p>{% endif %}\n')
    elif '{{ product_form.category.errors }}' in line:
        # replace the last appended line
        new_lines.pop()
        new_lines.append('                                {% if product_form.category.errors %}<p class="text-red-500 text-xs italic mt-1">{{ product_form.category.errors.0 }}</p>{% endif %}\n')
    elif '{{ product_form.description|add_class:"w-full border border-gray-300 rounded-md px-3 py-2"|attr:"id:description"|attr:"rows:4"|attr:"cols:50" }}' in line:
        new_lines.append('                                {% if product_form.description.errors %}<p class="text-red-500 text-xs italic mt-1">{{ product_form.description.errors.0 }}</p>{% endif %}\n')
    elif '<small class="text-gray-500 px-3">Add Product Image</small>' in line:
        new_lines.append('                            {% if product_form.image.errors %}<p class="text-red-500 text-xs italic mt-1 px-3">{{ product_form.image.errors.0 }}</p>{% endif %}\n')
    elif '{{ inventory_form.quantity|add_class:"w-30 border border-gray-300 rounded-md px-3 py-2"|attr:"id:product-qunatity"}}' in line:
        new_lines.append('                                {% if inventory_form.quantity.errors %}<p class="text-red-500 text-xs italic mt-1">{{ inventory_form.quantity.errors.0 }}</p>{% endif %}\n')
    elif '{{ inventory_form.low_stock_threshold|add_class:"w-30 border border-gray-300 rounded-md px-3 py-2"|attr:"id:inventory-report"}}' in line:
        new_lines.append('                                {% if inventory_form.low_stock_threshold.errors %}<p class="text-red-500 text-xs italic mt-1">{{ inventory_form.low_stock_threshold.errors.0 }}</p>{% endif %}\n')
    elif '<label for="fragile">Fragile</label>' in line:
        new_lines.append('                                {% if attribute_form.fragile.errors %}<p class="text-red-500 text-xs italic mt-1">{{ attribute_form.fragile.errors.0 }}</p>{% endif %}\n')
    elif '<label for="biodegradable">Biodegradable</label>' in line:
        new_lines.append('                                {% if attribute_form.biodegradable.errors %}<p class="text-red-500 text-xs italic mt-1">{{ attribute_form.biodegradable.errors.0 }}</p>{% endif %}\n')
    elif '{{ attribute_form.expiry_date|add_class:"hidden w-40 border border-gray-300 rounded-md px-3 py-2 animate-fadeInUp delay-100"|attr:"id:date" }}' in line:
        new_lines.append('                                {% if attribute_form.expiry_date.errors %}<p class="text-red-500 text-xs italic mt-1">{{ attribute_form.expiry_date.errors.0 }}</p>{% endif %}\n')
    elif '{{ pricing_form.case_selling_price|add_class:"w-full border border-gray-300 rounded-md px-3 py-2"|attr:"id:case_price" }}' in line:
        new_lines.append('                                    {% if pricing_form.case_selling_price.errors %}<p class="text-red-500 text-xs italic mt-1">{{ pricing_form.case_selling_price.errors.0 }}</p>{% endif %}\n')
    elif '{{ pricing_form.cost|add_class:"w-full border border-gray-300 rounded-md px-3 py-2"|attr:"id:cost" }}' in line:
        new_lines.append('                                    {% if pricing_form.cost.errors %}<p class="text-red-500 text-xs italic mt-1">{{ pricing_form.cost.errors.0 }}</p>{% endif %}\n')
    elif '<pre>{{pricing_form.cost.errors}}</pre>' in line:
        new_lines.pop() # Remove it
    elif '{{ pricing_form.case_cost|add_class:"w-full border border-gray-300 rounded-md px-3 py-2"|attr:"id:case_cost" }}' in line:
        new_lines.append('                                    {% if pricing_form.case_cost.errors %}<p class="text-red-500 text-xs italic mt-1">{{ pricing_form.case_cost.errors.0 }}</p>{% endif %}\n')
    elif '{{ pricing_form.case_count|add_class:"w-full border border-gray-300 rounded-md px-3 py-2"|attr:"id:case_count" }}' in line:
        new_lines.append('                                    {% if pricing_form.case_count.errors %}<p class="text-red-500 text-xs italic mt-1">{{ pricing_form.case_count.errors.0 }}</p>{% endif %}\n')
    elif '{{ pricing_form.pack_size|add_class:"w-full border border-gray-300 rounded-md px-3 py-2"|attr:"id:pack_size" }}' in line:
        new_lines.append('                                    {% if pricing_form.pack_size.errors %}<p class="text-red-500 text-xs italic mt-1">{{ pricing_form.pack_size.errors.0 }}</p>{% endif %}\n')
    elif '{{ pricing_form.damaged_units|add_class:"hidden"|attr:"id:damaged_master" }}' in line:
        new_lines.append('                                    {% if pricing_form.damaged_units.errors %}<p class="text-red-500 text-xs italic mt-1">{{ pricing_form.damaged_units.errors.0 }}</p>{% endif %}\n')
    elif '{{ inventory_form.quantity|add_class:"w-full border border-gray-300 rounded-md px-3 py-2"|attr:"id:Qty" }}' in line:
        new_lines.append('                                    {% if inventory_form.quantity.errors %}<p class="text-red-500 text-xs italic mt-1">{{ inventory_form.quantity.errors.0 }}</p>{% endif %}\n')
    elif '{% if product_form.errors %}' in line:
        # We need to replace these last lines with non_field_errors
        new_lines.pop() # remove this line
        # Add non field errors block
        block = """                        {% if product_form.non_field_errors %}
                        <div class="text-red-500 text-sm mt-4 p-3 bg-red-100 rounded-md mb-2">
                            {{ product_form.non_field_errors }}
                        </div>
                        {% endif %}
                        {% if pricing_form.non_field_errors %}
                        <div class="text-red-500 text-sm mt-4 p-3 bg-red-100 rounded-md mb-2">
                            {{ pricing_form.non_field_errors }}
                        </div>
                        {% endif %}
                        {% if inventory_form.non_field_errors %}
                        <div class="text-red-500 text-sm mt-4 p-3 bg-red-100 rounded-md mb-2">
                            {{ inventory_form.non_field_errors }}
                        </div>
                        {% endif %}
                        {% if attribute_form.non_field_errors %}
                        <div class="text-red-500 text-sm mt-4 p-3 bg-red-100 rounded-md mb-2">
                            {{ attribute_form.non_field_errors }}
                        </div>
                        {% endif %}
"""
        new_lines.append(block)
        skip_next = 8

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Done modifications")
