# API
<a name="compileTpl"></a>

## compileTpl(context, template, valuesStack) ⇒ <code>String</code>
Compile an run a template

**Kind**: global function  
**Returns**: <code>String</code> - The templating result  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Object</code> | Context (destructured) |
| context.transformations | <code>Object</code> | Map for template transformations |
| context.filters | <code>Object</code> | Map for filter filters |
| context.recastOptions | <code>Object</code> | Recast options object |
| template | <code>String</code> | The actual template |
| valuesStack | <code>Array.&lt;Object&gt;</code> | The values to fill the template |

