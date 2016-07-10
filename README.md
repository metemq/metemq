# MeteMQ

## Quick Start
Add MeteMQ package to yout Meteor project:

```bash
meteor add metemq:metemq
```

## How to test?

```bash
meteor test-packages ./ --driver-package practicalmeteor:mocha
```

You'll then be able to read the report locally in your browser at
`http://localhost:3000/`.

## Known issues

### If you get typescript compile error

```bash
rm -rf .meteor/local
```

and try again.
