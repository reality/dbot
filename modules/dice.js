var parseDiceSpec = function (specString) {
    var rawSpec = specString.valMatch(/^([0-9]*)d(%|[0-9]*)(|[+-][0-9]+)$/i, 4);
    if (rawSpec !== false) {
        if (rawSpec[2] === "%") {
            rawSpec[2] = 100;
        }
        return {
            "count": parseInt(rawSpec[1] || 1),
            "sides": parseInt(rawSpec[2] || 6),
            "modifier": parseInt(rawSpec[3] || 0)
        };
    } else {
        return false;
    }
};

var normalizeDiceSpec = function (specString) {
    var diceSpec = parseDiceSpec(specString);

    if (diceSpec["count"] > 1) {
        var count = diceSpec["count"];
    } else {
        var count = "";
    }

    if (diceSpec["sides"] === 100) {
        var sides = "%";
    } else {
        var sides = diceSpec["sides"];
    }

    if (diceSpec["modifier"] > 0) {
        var modifier = "+" + diceSpec["modifier"];
    } else if (diceSpec["modifier"] < 0) {
        var modifier = diceSpec["modifier"];
    } else {
        var modifier = "";
    }

    return (count + "d" + sides + modifier);
};

var dice = function(dbot) {
    var commands = {
        '~roll': function (event) {
            var rolls = [];

            if (event.params.length === 1) {
                event.params.push("d6");
            }

            for (var i = 1; i < event.params.length; i++) {
                var diceSpec = parseDiceSpec(event.params[i]);
                if (diceSpec === false) {
                    rolls.push([event.params[i], false]);
                } else {
                    rolls.push([normalizeDiceSpec(event.params[i]), [], diceSpec["modifier"]]);
                    for (var j = 0; j < diceSpec["count"] ; j++) {
                        rolls[rolls.length-1][1].push(Math.ceil(Math.random() * diceSpec["sides"]));
                    }
                }
            }

            for (var i = 0; i < rolls.length; i++) {
                if (rolls[i][1] === false) {
                    event.reply(rolls[i][0] + ": invalid dice spec");
                } else {
                    if (rolls[i][1].length > 1) {
                        var total = " (total " + rolls[i][1].sum();
                        if (rolls[i][2] != 0) {
                            if (rolls[i][2] > 0) {
                                total += " + ";
                            } else {
                                total += " - ";
                            }
                            total += Math.abs(rolls[i][2]) + " -> " + (rolls[i][1].sum() + rolls[i][2]);
                        }
                        total += ")"
                    } else {
                        var total = "";
                    }
                    event.reply(rolls[i][0] + ": " + rolls[i][1].join(" ") + total);
                }
            }
        }
    };

    return {
        'onLoad': function() {
            return commands;
        },

        'name': 'dice',

        'ignorable': true
    };
}

exports.fetch = function(dbot) {
    return dice(dbot);
};
