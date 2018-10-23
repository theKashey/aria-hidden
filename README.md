aria-hidden
====
Hides from ARIA everything, except provided node.
Helps to isolate modal dialogs and focused task - the content will be not accessible using
accesible tools.

# API
Just call `hideOthers` with DOM-node you want to keep, and it will hide everything else.
targetNode could be placed anywhere - its siblings would be hidden, but its parents - not.
```js
import {hideOthers} from 'aria-hidden';

const undo = hideOthers(DOMnode);
// everything else is "aria-hidden"

undo();
// all changes undone
```

you also may limit the effect by providing top level node as a second paramiter
```js
 hideOthers(targetNode, parentNode);
 hideOthers(anotherNode, document.getElementById('app'));
 // parentNode defaults to document.body 
```

# Size 
Code is 30 lines long

# Licence 
MIT