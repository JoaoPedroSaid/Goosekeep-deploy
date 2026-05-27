import { useState, useRef } from 'react'
import "../styles/CharacterView.css"
import "../styles/global.css"

import more from "../assets/more.png"
import exp from "../assets/exp.png"
import imp from "../assets/imp.png"
import arrow from "../assets/arrow.png"

function CharacterView({ character, onUpdateCharacter, onExportAll, onImportAll }) {
    const [loreOpen, setLoreOpen] = useState(true)
    const [editingLoreId, setEditingLoreId] = useState(null)
    const [openCategories, setOpenCategories] = useState({})
    const importRef = useRef(null)

    if (!character) {
        return (
            <main className="character-view">
                <header className="character-topbar">
                    <div className="topbar-io-buttons">
                        <button className="exp-button" onClick={onExportAll} title="Exportar todos os dados">
                            <img src={exp} alt="exportar" className="topbar-icon" />
                            <span className="topbar-btn-label">Exportar</span>
                        </button>
                        <button className="exp-button" onClick={() => importRef.current?.click()} title="Importar dados">
                            <img src={imp} alt="importar" className="topbar-icon topbar-icon--flip" />
                            <span className="topbar-btn-label">Importar</span>
                        </button>
                        <input
                            ref={importRef}
                            type="file"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={e => { if (e.target.files[0]) { onImportAll(e.target.files[0]); e.target.value = '' } }}
                        />
                    </div>
                </header>
                <div className="topbar-line"><div className="topbar-line-line"></div></div>
                <div className="character-view-empty">
                    <p>Selecione uma ficha para visualizar</p>
                </div>
            </main>
        )
    }

    function handleNameChange(e) {
        onUpdateCharacter({ ...character, name: e.target.value })
    }

    function handleLoreChange(loreId, value) {
        const updated = character.loreItems.map(item =>
            item.id === loreId ? { ...item, text: value } : item
        )
        onUpdateCharacter({ ...character, loreItems: updated })
    }

    function handleAddLore() {
        const newItem = { id: 'lore-' + Date.now(), text: '' }
        onUpdateCharacter({ ...character, loreItems: [...(character.loreItems || []), newItem] })
        setEditingLoreId(newItem.id)
    }

    function handleDeleteLore(loreId) {
        onUpdateCharacter({ ...character, loreItems: (character.loreItems || []).filter(i => i.id !== loreId) })
    }

    function handleAddCategory() {
        const newCat = { id: 'cat-' + Date.now(), name: 'Nova categoria', fields: [] }
        onUpdateCharacter({ ...character, categories: [...(character.categories || []), newCat] })
        setOpenCategories(prev => ({ ...prev, [newCat.id]: true }))
    }

    function handleDeleteCategory(catId) {
        onUpdateCharacter({ ...character, categories: (character.categories || []).filter(c => c.id !== catId) })
    }

    function handleCategoryNameChange(catId, value) {
        onUpdateCharacter({
            ...character,
            categories: (character.categories || []).map(c =>
                c.id === catId ? { ...c, name: value } : c
            )
        })
    }

    function handleAddField(catId) {
        const newField = { id: 'field-' + Date.now(), label: 'Campo', value: '' }
        onUpdateCharacter({
            ...character,
            categories: (character.categories || []).map(c =>
                c.id === catId ? { ...c, fields: [...(c.fields || []), newField] } : c
            )
        })
    }

    function handleFieldChange(catId, fieldId, key, value) {
        onUpdateCharacter({
            ...character,
            categories: (character.categories || []).map(c =>
                c.id !== catId ? c : {
                    ...c,
                    fields: (c.fields || []).map(f =>
                        f.id === fieldId ? { ...f, [key]: value } : f
                    )
                }
            )
        })
    }

    function handleDeleteField(catId, fieldId) {
        onUpdateCharacter({
            ...character,
            categories: (character.categories || []).map(c =>
                c.id !== catId ? c : {
                    ...c,
                    fields: (c.fields || []).filter(f => f.id !== fieldId)
                }
            )
        })
    }

    function toggleCategory(catId) {
        setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
    }

    return (
        <main className="character-view">

            <header className="character-topbar">
                <div className="topbar-io-buttons">
                    <button className="exp-button" onClick={onExportAll} title="Exportar todos os dados">
                        <img src={exp} alt="exportar" className="topbar-icon" />
                        <span className="topbar-btn-label">Exportar</span>
                    </button>
                    <button className="exp-button" onClick={() => importRef.current?.click()} title="Importar dados">
                        <img src={exp} alt="importar" className="topbar-icon topbar-icon--flip" />
                        <span className="topbar-btn-label">Importar</span>
                    </button>
                    <input
                        ref={importRef}
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={e => { if (e.target.files[0]) { onImportAll(e.target.files[0]); e.target.value = '' } }}
                    />
                </div>
            </header>

            <div className="topbar-line">
                <div className="topbar-line-line"></div>
            </div>

            <section className="character-content">

                <div className="character-header">
                    <input
                        className="character-name"
                        value={character.name}
                        onChange={handleNameChange}
                    />
                    <button className="new-category-button" onClick={handleAddCategory}>
                        <img src={more} alt="" className="content-icon" />
                        <span>Criar nova categoria</span>
                    </button>
                </div>

                <section className="info-section">

                    <button className="section-dropdown" onClick={() => setLoreOpen(prev => !prev)}>
                        <img
                            src={arrow}
                            alt=""
                            className={`content-icon arrow-icon${loreOpen ? ' arrow-icon--open' : ''}`}
                        />
                        <h2>Lore:</h2>
                    </button>

                    {loreOpen && (
                        <ul className="lore-list">
                            {(character.loreItems || []).map(item => (
                                <li key={item.id} className="lore-item">
                                    {editingLoreId === item.id ? (
                                        <input
                                            autoFocus
                                            className="lore-input"
                                            value={item.text}
                                            onChange={e => handleLoreChange(item.id, e.target.value)}
                                            onBlur={() => setEditingLoreId(null)}
                                            onKeyDown={e => e.key === 'Enter' && setEditingLoreId(null)}
                                        />
                                    ) : (
                                        <span
                                            className="lore-text"
                                            onClick={() => setEditingLoreId(item.id)}
                                        >
                                            {item.text || 'Clique para editar...'}
                                        </span>
                                    )}
                                    <button
                                        className="lore-delete"
                                        onClick={() => handleDeleteLore(item.id)}
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                            <li>
                                <button className="lore-add" onClick={handleAddLore}>
                                    + Adicionar item
                                </button>
                            </li>
                        </ul>
                    )}

                </section>

                <section className="sheet-section">

                    <h2 className="sheet-title">Ficha:</h2>

                    <div className="sheet-content">
                        {(character.categories || []).length === 0 && (
                            <p className="sheet-empty">
                                Clique em "Criar nova categoria" para adicionar atributos à ficha.
                            </p>
                        )}

                        {(character.categories || []).map(cat => (
                            <div key={cat.id} className="category-block">

                                <div className="category-header">
                                    <button
                                        className="section-dropdown"
                                        onClick={() => toggleCategory(cat.id)}
                                    >
                                        <img
                                            src={arrow}
                                            alt=""
                                            className={`content-icon arrow-small${openCategories[cat.id] ? ' arrow-small--open' : ''}`}
                                        />
                                    </button>
                                    <input
                                        className="category-name-input"
                                        value={cat.name}
                                        onChange={e => handleCategoryNameChange(cat.id, e.target.value)}
                                    />
                                    <button
                                        className="category-delete"
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        title="Excluir categoria"
                                    >
                                        ×
                                    </button>
                                </div>

                                {openCategories[cat.id] && (
                                    <div className="category-fields">
                                        {(cat.fields || []).map(field => (
                                            <div key={field.id} className="field-row">
                                                <input
                                                    className="field-label"
                                                    value={field.label}
                                                    onChange={e => handleFieldChange(cat.id, field.id, 'label', e.target.value)}
                                                />
                                                <input
                                                    className="field-value"
                                                    value={field.value}
                                                    onChange={e => handleFieldChange(cat.id, field.id, 'value', e.target.value)}
                                                />
                                                <button
                                                    className="field-delete"
                                                    onClick={() => handleDeleteField(cat.id, field.id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            className="field-add"
                                            onClick={() => handleAddField(cat.id)}
                                        >
                                            + Adicionar campo
                                        </button>
                                    </div>
                                )}

                            </div>
                        ))}
                    </div>

                </section>

            </section>

        </main>
    )
}

export default CharacterView
