// The sizes a full-screen card takes from its configuration, as CSS properties its styles use.

const SIZES = {
    height: '--kids-dashboard-height',
    inset_right: '--kids-dashboard-inset-right',
    inset_bottom: '--kids-dashboard-inset-bottom',
}

export function applySizes(element, config) {
    for (const [key, property] of Object.entries(SIZES)) {
        if (config[key]) {
            element.style.setProperty(property, config[key])
        }
    }
}
