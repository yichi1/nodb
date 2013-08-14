var fs = require('fs');

function parse(data) {
    var regex = {
            section: /^\s*\[\s*([^\]  ]*)\s*\]\s*$/,
            param: /^\s*([\w\.\-\_ ]+)\s*=\s*(.*?)\s*$/,
            comment: /^\s*;.*$/,
            contline: /\s*\\$/,
        },
        value = {},
        section = null,
        line = '',
        lines = data.split(/\r\n|\r|\n/);
    //foreach line 
    lines.forEach(function(oneLine) {
        var match    = [],
            lineKey  = [],
            itemKey  = [],
            valueKey = '';
        if (/\w+/.test(oneLine)) {
            oneLine = oneLine.trim();
            if (regex.contline.test(oneLine)) {
                line += oneLine.replace(regex.contline, ' ');
                return;
            } else {
                line += oneLine;
            }
            if (regex.comment.test(line)) {
                line = '';
                return;
            } else if (regex.param.test(line)) {
                match = line.match(regex.param);
                lineKey = match[1].split(/\s+/);
                if (/\d+$/.test(lineKey[0])) {
                    itemKey = lineKey[0].match(/(\w+)(\d+)/);
                    valueKey = match[1].substr(lineKey[0].length + 1).trim();
                    if (section) {
                        value[section][itemKey[1]] = 
                            value[section][itemKey[1]] || [];
                        value[section][itemKey[1]][itemKey[2]] =
                            value[section][itemKey[1]][itemKey[2]] || {};
                        value[section][itemKey[1]][itemKey[2]][valueKey] = 
                            match[2].trim();
                    }
                } else if (lineKey[0] === 'msg') {
                    if (section) {
                        value[section][lineKey[0]] = 
                            value[section][lineKey[0]] || {}; 
                        value[section][lineKey[0]][lineKey[1]] = 
                            match[2].trim();
                    }  
                } else {
                    if (section) {
                        value[section][match[1].trim()] = match[2].trim();
                    } 
                }
            } else if (regex.section.test(line)) {
                match = line.match(regex.section);
                value[match[1]] = {};
                section = match[1];
            } else if (line.length === 0 && section) {
                section = null;
            };
        }
        line = '';
    });
    return value;
};

module.exports.parseIni = function(iniPath) {
    var data = fs.readFileSync(iniPath, 'utf-8');
    if (!data) {
        console.log('Failed to read %s', iniPath);
    } else {
        return parse(data);
    }
};
