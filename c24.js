const readyPromise = new Promise((resolve, reject) => {
    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
        setTimeout(() => resolve(), 1);
    } else {
        const onContentLoaded = () => {
            resolve();
            document.removeEventListener('DOMContentLoaded', onContentLoaded, false);
        }
        document.addEventListener('DOMContentLoaded', onContentLoaded, false);
    }
})

const colors = {
    light: "#fff",
    shadow: "#000",
    element: "#333",
    second: "#f00",
    event1: "#610505",
    event2: "#791006",
    event3: "#911f08",
    event4: "#aa3109",
    event5: "#c2470a",
    event6: "#da620b",
    event7: "#f2800d",
    event8: "#f49d25",
    event9: "#f5b83d",
    event10: "#f6ce55",
    event11: "#f7e06e",
    event12: "#f9ef86",
    event13: "#fafa9e"
};

const hand_props = {
    hour12: {
        begin: 1,
        end: 12,
        offset: 3,
        color: colors.element,
        width: 5,
        length: 0.5,
    },
    hour24: {
        begin: 0,
        end: 23,
        offset: 18,
        color: colors.element,
        width: 5,
        length: 0.5,
    },
    minute: {
        begin: 1,
        end: 60,
        offset: 15,
        color: colors.element,
        width: 4,
        length: 0.8,
    },
    second: {
        begin: 1,
        end: 60,
        offset: 15,
        color: colors.second,
        width: 3,
        length: 0.9,
    },
};

const legend_props = {
    hour: {
        tick_length: 0.6,
        text_length: 0.68,
        text_n: null,
        size: 35/400,
    },
    minute_second: {
        tick_length: 0.89,
        text_length: 0.89,
        text_n: 5,
        size: 25/400,
    },
};

const events = [
    [[[8, 12], [13, 17]], 2, colors.event7],
    [[[11, 12], [13, 20]], 1, colors.event10],
    [[[22, 5]], 3, colors.event4],
    [[[7.9, 9]], 4, colors.event12]
];

const init = (canvas, params) => {
    const clock = {}
    window.clock = clock
    if (!params) {
        params = {}
    }

    clock.canvas = params.canvas ? params.canvas : canvas;

    clock.color_shadow = colors.shadow;
    clock.color_light = colors.light;

    clock.width = params.width ? params.width : (clock.canvas ? clock.canvas.width : 500)
    clock.height = params.height ? params.height : (clock.canvas ? clock.canvas.height : 500)
    clock.h_size = params.h_size ? params.h_size : 22
    clock.m_size = params.m_size ? params.m_size : 11
    clock.effect_width = params.effect_width ? params.effect_width : 2
    clock.hand_props = {}
    clock.hand_props.hour = params.use_12 ? hand_props.hour12 : hand_props.hour24
    clock.hand_props.minute = hand_props.minute
    clock.hand_props.second = hand_props.second
    clock.parent = clock.canvas ? clock.canvas.parentElement : (params.parent ? params.parent : clock.parent = document.body)

    if (!clock.canvas) {
        clock.canvas = document.createElement("canvas");
        clock.parent.appendChild(clock.canvas)
    }

    clock.canvas.width = clock.width;
    clock.canvas.height = clock.height;
    clock.ctx = clock.canvas.getContext("2d");
    clock.clock_radius = Math.min(clock.ctx.canvas.width, clock.ctx.canvas.height) / 2
    return clock
}

const clean = (clock) => {
    clock.ctx.clearRect(0, 0, clock.ctx.canvas.width, clock.ctx.canvas.height);
    clock.ctx.translate(clock.ctx.canvas.width / 2, clock.ctx.canvas.height / 2)
};

const with_effect = (clock, color, code) => {
    for (let [fill_color, translate] of [[clock.color_shadow, 1],[clock.color_light, -1]]) {
        for (let index = 0; index < clock.effect_width; index++) {
            with_save_restore(clock, () => {
                clock.ctx.translate(0, index * translate);
                clock.ctx.fillStyle = fill_color;
                clock.ctx.globalAlpha = .5;
                code();
            })
        }
    }
    with_save_restore(clock, () => {
        clock.ctx.fillStyle = color;
        code();
    })
};

const get_angle = (value, hand_props) => (value - hand_props.offset) * 2 * Math.PI / (hand_props.end - hand_props.begin + 1);

const iterate_on_hand = (hand_props, code) => {
    for (let value = hand_props.begin; value <= hand_props.end; value++) {
        const theta = get_angle(value, hand_props);
        code(value, theta)
    }
}

const draw_hand = (clock, value, hand_props) => {
    with_effect(clock, hand_props.color, () => {
        const theta = get_angle(value, hand_props);
        clock.ctx.rotate(theta);
        clock.ctx.beginPath();
        clock.ctx.moveTo(-15, -hand_props.width);
        clock.ctx.lineTo(-15, hand_props.width);
        clock.ctx.lineTo(clock.clock_radius * hand_props.length, 1);
        clock.ctx.lineTo(clock.clock_radius * hand_props.length, -1);
        clock.ctx.fill()
    })
};
const draw_tick = (clock, theta, radius, length, color) => {
    with_effect(clock, color, () => {
        const x = clock.clock_radius * length * Math.cos(theta);
        const y = clock.clock_radius * length * Math.sin(theta);
        clock.ctx.beginPath();
        clock.ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        clock.ctx.closePath();
        clock.ctx.fill()
    })
};

const fontSizeCache = {}

const determineFontSize = (family, size, weight, text) => {
    const key = `${family}-${size}-${weight}-${text}`;
    if (fontSizeCache[key]) {
        return fontSizeCache[key];
    }
    const fontStyle = `font-family: ${family}; font-size: ${size}; font-weight : ${weight}; margin:0;padding:0;border:0; position: fixed; left:0; top:0;`
    const body = document.body;
    const dummyParagraph = document.createElement("p");
    const dummyElement = document.createElement("span");
    const dummyText = document.createTextNode(text);
    dummyElement.appendChild(dummyText);
    dummyElement.setAttribute("style", fontStyle);
    dummyParagraph.appendChild(dummyElement);
    body.appendChild(dummyParagraph);
    const result = [dummyElement.offsetWidth, dummyElement.offsetHeight];
    body.removeChild(dummyParagraph);
    fontSizeCache[key] = result;
    return result;
}

const draw_text = (clock, value, theta, text_size, length, color) => {
    with_effect(clock, color, () => {
        const fontFamily = 'Sans-Serif'
        const fontSize = `${text_size}px`
        clock.ctx.font = `${fontSize} ${fontFamily}`
        const size = determineFontSize(fontFamily, fontSize, 'normal', value)
        const [width, height] = size
        const x0 = clock.clock_radius * length * Math.cos(theta)
        const y0 = clock.clock_radius * length * Math.sin(theta)
        const x1 = x0-width/2
        const y1 = y0-height/2
        const x2 = x1
        const y2 = y1+height/2+height/4
        clock.ctx.fillText(value, x2, y2)
    })
};
const draw_arc = (clock, hour1, hour2, hand_props, length_min, length_max, color) => {
    with_effect(clock, color, () => {
        clock.ctx.globalAlpha = .4
        const theta1 = get_angle(hour1, hand_props)
        const theta2 = get_angle(hour2, hand_props)
        const radius_min = clock.clock_radius * length_min
        const radius_max = clock.clock_radius * length_max
        clock.ctx.beginPath()
        clock.ctx.arc(0, 0, radius_max, theta1, theta2, false)
        clock.ctx.arc(0, 0, radius_min, theta2, theta1, true)
        clock.ctx.closePath();
        clock.ctx.fill()
    })
};
const draw_event = (clock, hour_range, level, color) => {
    const results = [];
    for (let i = 0; i < hour_range.length; i++) {
        const hour_item = hour_range[i];
        const hour_min = hour_item[0];
        const hour_max = hour_item[1];
        results.push(draw_arc(clock, hour_min, hour_max, clock.hand_props.hour, .2 + .05 * level, .3 + .05 * level, color))
    }
    return results
};
const draw_events = (clock, events) => {
    const results = [];
    for (i = 0; i < events.length; i++) {
        const event = events[i];
        const hour_range = event[0];
        const level = event[1];
        const color = event[2];
        results.push(draw_event(clock, hour_range, level, color))
    } return results
};

const with_save_restore = (clock, code) => {
    clock.ctx.save()
    code()
    clock.ctx.restore()
}

const draw_legend = (clock, hand_props, legend_props) => {
    iterate_on_hand(hand_props, (value, theta) => {
        if ((legend_props.text_n === null) || (value % legend_props.text_n === 0)) {
            draw_text(clock, value, theta, clock.clock_radius * legend_props.size, legend_props.text_length, clock.color)
        } 
        if ((legend_props.text_n === null) || (value % legend_props.text_n !== 0)) {
            draw_tick(clock, theta, 1, legend_props.tick_length, clock.color)
        }
    });
}

const draw_scene = (clock) => {
    clock.canvas.width = clock.width;
    clock.canvas.height = clock.height;
    with_save_restore(clock, () => {
        clean(clock);
        const date = new Date;
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const milliseconds = date.getMilliseconds();
        const numSeconds = seconds + milliseconds / 1000;
        const numMinute = minutes + numSeconds / 60;
        const numHour = hours + numMinute / 60;

        draw_legend(clock, clock.hand_props.hour, legend_props.hour);
        draw_legend(clock, clock.hand_props.minute, legend_props.minute_second);

        draw_events(clock, clock.events);
        
        draw_hand(clock, numHour, clock.hand_props.hour);
        draw_hand(clock, numMinute, clock.hand_props.minute);
        draw_hand(clock, numSeconds, clock.hand_props.second);
    })
};

const start = (clock) => {
    const listener = () => {
        let height = window.innerHeight;
        let width = window.innerWidth;
        clock.width = width;
        clock.height = height;
        clock.clock_radius = Math.min(width, height)/2;
        clock.events = events;
    }
    listener()
    window.addEventListener("resize", listener);
    draw_scene(clock)
    setInterval(() => draw_scene(clock), 1000 / 30)
};

readyPromise.then(() => {
    const clock = init(null, {
        effect_width: 2,
        use_12: false,
    });
    start(clock)
})
