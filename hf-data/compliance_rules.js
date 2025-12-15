// compliance_rules.js

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}/; // 简单日期检查

// 许可证映射表 (对应 SQL 中的 Fix License 部分)
const LICENSE_NORMALIZATION_MAP = [
    { target: "None", sources: [null, undefined, "None", "unknown"] },
    { target: "llama3", sources: ["llama3", "llama-3", "llama-3-community-license"] },
    { target: "gemma", sources: ["gemma", "gemma-terms-of-use"] },
    { target: "apple-ascl", sources: ["apple-ascl", "apple-sample-code-license"] },
    { target: "mit", sources: ["mit", "mit-license"] },
    // 注意: SQL 中最后有一条 default: set to n.license[0]，我们在代码逻辑中处理
];

// 风险类型定义的列表 (对应 SQL 中的 lists)
const RISK_LISTS = {
    // h_Mismatch 的目标列表
    h_Mismatch: new Set(["apache-2.0", "None", "mit", "cc-by-nc-4.0", "cc-by-4.0", "cc-by-nc-sa-4.0", "cc-by-sa-4.0", "bsd-3-clause", "gpl-3.0", "unknown", "cc", "cc-by-nc-nd-4.0", "afl-3.0", "agpl-3.0", "cc0-1.0", "wtfpl", "cc-by-nc-2.0", "artistic-2.0", "unlicense", "cc-by-sa-3.0", "bsl-1.0", "gpl", "apple-ascl", "osl-3.0", "cc-by-nc-3.0", "cc-by-2.0", "gpl-2.0", "bsd", "ms-pl", "ecl-2.0", "bsd-3-clause-clear", "cc-by-3.0", "lgpl-3.0", "deepfloyd-if-license", "mpl-2.0", "pddl", "bsd-2-clause", "cc-by-nd-4.0", "cdla-permissive-2.0", "eupl-1.1", "cc-by-nc-sa-3.0", "etalab-2.0", "odc-by", "cc-by-2.5", "ofl-1.1", "odbl", "cc-by-nc-sa-2.0", "cdla-sharing-1.0", "lgpl-lr", "lgpl", "zlib"]),

    // g_Copyleft_Terms (传染性较强的条款)
    g_Source: new Set(["creativeml-openrail-m", "llama2", "cc-by-nc-4.0", "gemma", "llama3", "openrail++", "llama3.1", "llama3.2", "openrail", "bigcode-openrail-m", "cc-by-nc-3.0", "bigscience-bloom-rail-1.0", "llama3.3", "bigscience-openrail-m", "cc-by-nc-2.0", "deepfloyd-if-license", "c-uda"]),
    
    // f_Copyleft (标准 Copyleft)
    f_Source: new Set(["cc-by-nc-sa-4.0", "cc-by-sa-4.0", "gpl-3.0", "agpl-3.0", "cc-by-sa-3.0", "gpl", "osl-3.0", "gpl-2.0", "ms-pl", "lgpl-3.0", "mpl-2.0", "eupl-1.1", "cc-by-nc-sa-3.0", "odbl", "cc-by-nc-sa-2.0", "cdla-sharing-1.0", "lgpl-lr", "lgpl", "epl-2.0", "epl-1.0", "lgpl-2.1"]),

    // e_Conflict_ND (禁止演绎)
    e_Source: new Set(["cc-by-nc-nd-4.0", "cc-by-nd-4.0"]),

    // d_Conflict_CC (CC 协议冲突)
    d_Source: new Set(["cc-by-nc-4.0", "cc-by-4.0", "cc-by-nc-sa-4.0", "cc-by-sa-4.0", "cc", "cc-by-nc-2.0", "cc-by-sa-3.0", "cc-by-nc-3.0", "cc-by-2.0", "cc-by-3.0", "cc-by-nc-sa-3.0", "cc-by-2.5", "cc-by-nc-sa-2.0"]),
    d_ConflictTarget: new Set(["other", "creativeml-openrail-m", "llama2", "gemma", "llama3", "openrail++", "llama3.1", "llama3.2", "openrail", "bigcode-openrail-m", "bigscience-bloom-rail-1.0", "llama3.3", "agpl-3.0", "bigscience-openrail-m", "gpl", "apple-ascl", "osl-3.0", "gpl-2.0", "lgpl-3.0", "deepfloyd-if-license", "mpl-2.0", "pddl", "eupl-1.1", "odbl", "cdla-sharing-1.0", "lgpl-lr", "lgpl", "epl-2.0", "epl-1.0", "lgpl-2.1"]),

    // c_Conflict_FSF (自由软件基金会定义冲突 - 上游检查)
    c_Source: new Set(["gpl-3.0", "agpl-3.0", "gpl"]),
    c_ConflictParent: new Set(["other", "creativeml-openrail-m", "llama2", "cc-by-nc-4.0", "gemma", "llama3", "openrail++", "llama3.1", "llama3.2", "cc-by-nc-sa-4.0", "openrail", "bigcode-openrail-m", "bigscience-bloom-rail-1.0", "unknown", "cc", "cc-by-nc-nd-4.0", "llama3.3", "cc-by-nc-2.0", "cc-by-sa-3.0", "apple-ascl", "cc-by-nc-3.0", "cc-by-2.0", "deepfloyd-if-license", "pddl", "cc-by-nd-4.0", "cc-by-nc-sa-3.0", "etalab-2.0", "odc-by", "cc-by-2.5", "cc-by-nc-sa-2.0", "cdla-sharing-1.0", "lgpl-lr", "deepfloyd-if-license", "odbl", "osl-3.0", "ms-pl", "eupl-1.1", "afl-3.0"])
};

module.exports = { LICENSE_NORMALIZATION_MAP, RISK_LISTS };