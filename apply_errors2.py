import re

file_path = r'c:\Users\HP\Desktop\shartApp\ghajiSale\templates\product\add_product.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fields to match and their respective form/field names
fields = [
    (r'\{\{\s*product_form\.name[^}]*\}\}', 'product_form', 'name'),
    (r'\{\{\s*product_form\.barcode[^}]*\}\}', 'product_form', 'barcode'),
    (r'\{\{\s*pricing_form\.retail_price[^}]*\}\}', 'pricing_form', 'retail_price'),
    (r'\{\{\s*product_form\.category[^}]*\}\}', 'product_form', 'category'),
    (r'\{\{\s*product_form\.description[^}]*\}\}', 'product_form', 'description'),
    (r'<small class="text-gray-500 px-3">Add Product Image</small>', 'product_form', 'image'),
    (r'\{\{\s*inventory_form\.quantity\|add_class:"w-30[^}]*\}\}', 'inventory_form', 'quantity'),
    (r'\{\{\s*inventory_form\.low_stock_threshold[^}]*\}\}', 'inventory_form', 'low_stock_threshold'),
    (r'<label for="fragile">Fragile</label>', 'attribute_form', 'fragile'),
    (r'<label for="biodegradable">Biodegradable</label>', 'attribute_form', 'biodegradable'),
    (r'\{\{\s*attribute_form\.expiry_date[^}]*\}\}', 'attribute_form', 'expiry_date'),
    (r'\{\{\s*pricing_form\.case_selling_price[^}]*\}\}', 'pricing_form', 'case_selling_price'),
    (r'\{\{\s*pricing_form\.cost[^}]*\}\}', 'pricing_form', 'cost'),
    (r'\{\{\s*pricing_form\.case_cost[^}]*\}\}', 'pricing_form', 'case_cost'),
    (r'\{\{\s*pricing_form\.case_count[^}]*\}\}', 'pricing_form', 'case_count'),
    (r'\{\{\s*pricing_form\.pack_size[^}]*\}\}', 'pricing_form', 'pack_size'),
    (r'\{\{\s*pricing_form\.damaged_units[^}]*\}\}', 'pricing_form', 'damaged_units'),
    (r'\{\{\s*inventory_form\.quantity\|add_class:"w-full[^}]*\}\}', 'inventory_form', 'quantity'),
]

# We need to make sure we don't duplicate error messages if running multiple times.
# First, remove any existing injected error messages the best we can just to be safe.
content = re.sub(r'\{%\s*if [a-z0-9_]+\.[a-z0-9_]+\.errors\s*%\}[\s\S]*?\{%\s*endif\s*%\}', '', content)
content = re.sub(r'\{%\s*if [a-z0-9_]+\.non_field_errors\s*%\}[\s\S]*?\{%\s*endif\s*%\}', '', content)
content = re.sub(r'<div class="text-red-500 text-sm mt-4 p-3 bg-red-100 rounded-md[^>]*>[\s\S]*?</div>', '', content)
# remove the bottom error dump
content = re.sub(r'\{%\s*if [a-z0-9_]+\.errors\s*%\}[\s\S]*?<pre>\{\{ [a-z0-9_]+\.errors \}\}</pre>[\s\S]*?\{%\s*endif\s*%\}', '', content)
content = content.replace('<pre>{{pricing_form.cost.errors}}</pre>', '')
content = content.replace('{{ product_form.category.errors }}', '')

# Apply errors
for pattern, form_name, field_name in fields:
    def replacer(match):
        error_block = f'\n{% if {form_name}.{field_name}.errors %}\n    <p class="text-red-500 text-xs italic mt-1">{{{{ {form_name}.{field_name}.errors.0 }}}}</p>\n{{% endif %}}'
        return match.group(0) + error_block
    
    content = re.sub(pattern, replacer, content, count=1) 
    # Notice we don't want to replace quantity twice uniformly, but the regex for w-30 and w-full differ so it's fine.

# Replace product Image again since it has a specific place
# wait, image was just a string match, let's just make it general.

# Non-field errors
non_field_errors = """
{% if product_form.non_field_errors %}
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

# Put non-field errors at the end of the second column or before the submit buttons
# Actually, wait, let's put it next to where they were before: at the very end of the second column
content = content.replace('                </section>\n            </section> \n\n        {% endblock %}', f'{non_field_errors}\n                </section>\n            </section> \n\n        {{% endblock %}}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
