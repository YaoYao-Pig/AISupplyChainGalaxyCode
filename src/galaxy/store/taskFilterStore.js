import eventify from 'ngraph.events';

function createTaskFilterStore() {
    // 默认所有类型都是开启的
    let enabledTypes = new Map([
        ['Multimodal', true],
        ['Natural Language Processing', true],
        ['Computer Vision', true],
        ['Audio', true],
        ['Tabular', true],
        ['Other', true]
    ]);

    const api = {
        getEnabledTypes: () => new Map(enabledTypes),
        toggleType: (typeName) => {
            if (enabledTypes.has(typeName)) {
                enabledTypes.set(typeName, !enabledTypes.get(typeName));
                api.fire('changed');
            }
        },
        isEnabled: (typeName) => {
            return enabledTypes.has(typeName) ? enabledTypes.get(typeName) : true;
        }
    };

    eventify(api);
    return api;
}

const taskFilterStore = createTaskFilterStore();
export default taskFilterStore;