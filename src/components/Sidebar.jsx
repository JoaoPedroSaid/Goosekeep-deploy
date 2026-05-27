import { useState, useRef } from 'react'
import "../styles/global.css"
import "../styles/sidebar.css"

import menuArrow from "../assets/menu-arrow.png"
import menuMenu from "../assets/menu-menu.png"
import arrow from "../assets/arrow.png"
import folder from "../assets/folder.png"
import page from "../assets/page.png"
import search from "../assets/search.png"
import trash from "../assets/trash.png"

const TRASH_LABELS = { campaign: 'Campanha', character: 'Ficha', folder: 'Pasta' }

function Sidebar({
    campaigns,
    selectedCampaignId,
    selectedCharacterId,
    onSelectCampaign,
    onSelectCharacter,
    onCreateCampaign,
    onDeleteCampaign,
    onRenameCampaign,
    onCreateFolder,
    onDeleteFolder,
    onRenameFolder,
    onCreateCharacter,
    onDeleteCharacter,
    onCloseSidebar,
    trash: trashItems,
    onRestoreFromTrash,
    onEmptyTrash,
}) {
    const [campaignMenuOpen, setCampaignMenuOpen] = useState(false)
    const [openFolders, setOpenFolders] = useState({})
    const [renamingId, setRenamingId] = useState(null)
    const [renameValue, setRenameValue] = useState('')
    const [creatingCampaign, setCreatingCampaign] = useState(false)
    const [newCampaignName, setNewCampaignName] = useState('')
    const [creatingFolder, setCreatingFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')

    // Search panel
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Trash panel
    const [trashOpen, setTrashOpen] = useState(false)

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || null

    // Search results: all characters across all campaigns
    const searchResults = searchQuery.trim().length > 0
        ? campaigns.flatMap(c => [
            ...(c.characters || []).map(ch => ({ char: ch, campaignName: c.name, campaignId: c.id, folderId: null })),
            ...(c.folders || []).flatMap(f =>
                (f.characters || []).map(ch => ({ char: ch, campaignName: c.name, campaignId: c.id, folderId: f.id, folderName: f.name }))
            )
          ]).filter(r => r.char.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : []

    function toggleFolder(folderId) {
        setOpenFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }))
    }

    function startRename(id, currentName) {
        setRenamingId(id)
        setRenameValue(currentName)
    }

    function commitRename(type, id) {
        if (renameValue.trim()) {
            if (type === 'campaign') onRenameCampaign(id, renameValue.trim())
            if (type === 'folder') onRenameFolder(id, renameValue.trim())
        }
        setRenamingId(null)
        setRenameValue('')
    }

    function handleRenameKeyDown(e, type, id) {
        if (e.key === 'Enter') commitRename(type, id)
        if (e.key === 'Escape') { setRenamingId(null); setRenameValue('') }
    }

    function handleCreateCampaign() {
        if (newCampaignName.trim()) {
            onCreateCampaign(newCampaignName.trim())
        }
        setNewCampaignName('')
        setCreatingCampaign(false)
        setCampaignMenuOpen(false)
    }

    function handleCreateCampaignKeyDown(e) {
        if (e.key === 'Enter') handleCreateCampaign()
        if (e.key === 'Escape') { setCreatingCampaign(false); setNewCampaignName('') }
    }

    function handleCreateFolder() {
        if (newFolderName.trim()) {
            onCreateFolder(newFolderName.trim())
        }
        setNewFolderName('')
        setCreatingFolder(false)
    }

    function handleCreateFolderKeyDown(e) {
        if (e.key === 'Enter') handleCreateFolder()
        if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') }
    }

    function handleSearchResultClick(result) {
        onSelectCampaign(result.campaignId)
        onSelectCharacter(result.char.id)
        setSearchOpen(false)
        setSearchQuery('')
    }

    return (
        <aside className="sidebar">

            <div className="sidebar-top">

                <div className="sidebar-header">
                    <img src="/public/icon.png" alt="Logo" className="logo" />
                    <button className="icon-button" onClick={onCloseSidebar}>
                        <img src={menuArrow} alt="Fechar menu" className="icon collapse-icon" />
                    </button>
                </div>

                <div className="campaign-menu-wrapper">
                    <button className="menu-button" onClick={() => setCampaignMenuOpen(prev => !prev)}>
                        <img src={menuMenu} alt="" className="icon" />
                        <p>Gerenciar campanhas</p>
                    </button>

                    {campaignMenuOpen && (
                        <div className="campaign-menu">

                            <ul className="campaign-menu-list">
                                {campaigns.length === 0 && (
                                    <li className="campaign-menu-empty">Nenhuma campanha ainda</li>
                                )}
                                {campaigns.map(c => (
                                    <li key={c.id} className="campaign-menu-item">
                                        {renamingId === c.id ? (
                                            <input
                                                autoFocus
                                                className="rename-input"
                                                value={renameValue}
                                                onChange={e => setRenameValue(e.target.value)}
                                                onBlur={() => commitRename('campaign', c.id)}
                                                onKeyDown={e => handleRenameKeyDown(e, 'campaign', c.id)}
                                            />
                                        ) : (
                                            <span
                                                className={`campaign-menu-name${c.id === selectedCampaignId ? ' campaign-menu-name--active' : ''}`}
                                                onClick={() => { onSelectCampaign(c.id); setCampaignMenuOpen(false) }}
                                            >
                                                {c.name}
                                            </span>
                                        )}
                                        <div className="campaign-menu-actions">
                                            <button
                                                className="campaign-action-button"
                                                onClick={() => startRename(c.id, c.name)}
                                                title="Renomear"
                                            >
                                                /
                                            </button>
                                            <button
                                                className="campaign-action-button campaign-action-button--delete"
                                                onClick={() => onDeleteCampaign(c.id)}
                                                title="Excluir"
                                            >
                                                x
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {creatingCampaign ? (
                                <div className="new-item-input-row">
                                    <input
                                        autoFocus
                                        className="new-item-input"
                                        placeholder="Nome da campanha"
                                        value={newCampaignName}
                                        onChange={e => setNewCampaignName(e.target.value)}
                                        onKeyDown={handleCreateCampaignKeyDown}
                                        onBlur={handleCreateCampaign}
                                    />
                                </div>
                            ) : (
                                <button className="campaign-menu-create" onClick={() => setCreatingCampaign(true)}>
                                    + Nova campanha
                                </button>
                            )}

                        </div>
                    )}
                </div>

                <div className="sidebar-content">
                    {selectedCampaign && (
                        <section className="sidebar-section">

                            <h2 className="section-title">{selectedCampaign.name}</h2>

                            <div className="sidebar-campaign-actions">
                                <button
                                    className="sidebar-action-button"
                                    onClick={() => onCreateCharacter(null)}
                                >
                                    + Nova ficha
                                </button>
                                <button
                                    className="sidebar-action-button"
                                    onClick={() => setCreatingFolder(true)}
                                >
                                    + Nova pasta
                                </button>
                            </div>

                            {creatingFolder && (
                                <div className="new-item-input-row">
                                    <input
                                        autoFocus
                                        className="new-item-input"
                                        placeholder="Nome da pasta"
                                        value={newFolderName}
                                        onChange={e => setNewFolderName(e.target.value)}
                                        onKeyDown={handleCreateFolderKeyDown}
                                        onBlur={handleCreateFolder}
                                    />
                                </div>
                            )}

                            <ul className="sidebar-list">

                                {(selectedCampaign.characters || []).map(char => (
                                    <li key={char.id} className="sidebar-file-row">
                                        <button
                                            className={`sidebar-item file-item${char.id === selectedCharacterId ? ' file-item--active' : ''}`}
                                            onClick={() => onSelectCharacter(char.id)}
                                        >
                                            <img src={page} alt="" className="icon" />
                                            <span>{char.name}</span>
                                        </button>
                                        <button
                                            className="sidebar-delete-button"
                                            onClick={() => onDeleteCharacter(char.id, null)}
                                            title="Excluir ficha"
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}

                                {(selectedCampaign.folders || []).map(f => (
                                    <li key={f.id}>

                                        <div className="sidebar-folder-row">
                                            <button
                                                className="sidebar-item"
                                                onClick={() => toggleFolder(f.id)}
                                            >
                                                <img
                                                    src={arrow}
                                                    alt=""
                                                    className={`icon arrow-icon${openFolders[f.id] ? ' arrow-icon--open' : ''}`}
                                                />
                                                <img src={folder} alt="" className="icon" />
                                                {renamingId === f.id ? (
                                                    <input
                                                        autoFocus
                                                        className="rename-input"
                                                        value={renameValue}
                                                        onChange={e => setRenameValue(e.target.value)}
                                                        onBlur={() => commitRename('folder', f.id)}
                                                        onKeyDown={e => handleRenameKeyDown(e, 'folder', f.id)}
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <span>{f.name}</span>
                                                )}
                                            </button>
                                            <div className="folder-actions">
                                                <button
                                                    className="sidebar-action-icon"
                                                    onClick={() => onCreateCharacter(f.id)}
                                                    title="Nova ficha na pasta"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    className="sidebar-action-icon"
                                                    onClick={() => startRename(f.id, f.name)}
                                                    title="Renomear pasta"
                                                >
                                                    /
                                                </button>
                                                <button
                                                    className="sidebar-action-icon sidebar-action-icon--delete"
                                                    onClick={() => onDeleteFolder(f.id)}
                                                    title="Excluir pasta"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>

                                        {openFolders[f.id] && (
                                            <ul className="nested-list">
                                                {(f.characters || []).length === 0 && (
                                                    <li className="nested-empty">Pasta vazia</li>
                                                )}
                                                {(f.characters || []).map(char => (
                                                    <li key={char.id} className="sidebar-file-row">
                                                        <button
                                                            className={`sidebar-item file-item${char.id === selectedCharacterId ? ' file-item--active' : ''}`}
                                                            onClick={() => onSelectCharacter(char.id)}
                                                        >
                                                            <img src={page} alt="" className="icon" />
                                                            <span>{char.name}</span>
                                                        </button>
                                                        <button
                                                            className="sidebar-delete-button"
                                                            onClick={() => onDeleteCharacter(char.id, f.id)}
                                                            title="Excluir ficha"
                                                        >
                                                            ×
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                    </li>
                                ))}

                            </ul>

                        </section>
                    )}

                    {!selectedCampaign && (
                        <div className="sidebar-no-campaign">
                            <p>Selecione ou crie uma campanha</p>
                        </div>
                    )}

                </div>

            </div>

            <div className="sidebar-footer">

                {/* ── Search panel ── */}
                {searchOpen && (
                    <div className="footer-panel">
                        <input
                            autoFocus
                            className="new-item-input"
                            placeholder="Buscar ficha..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                        />
                        {searchQuery.trim().length > 0 && (
                            <ul className="search-results">
                                {searchResults.length === 0 && (
                                    <li className="search-empty">Nenhuma ficha encontrada</li>
                                )}
                                {searchResults.map(r => (
                                    <li key={r.char.id}>
                                        <button className="search-result-item" onClick={() => handleSearchResultClick(r)}>
                                            <span className="search-result-name">{r.char.name}</span>
                                            <span className="search-result-meta">
                                                {r.campaignName}{r.folderName ? ` / ${r.folderName}` : ''}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* ── Trash panel ── */}
                {trashOpen && (
                    <div className="footer-panel">
                        <div className="trash-panel-header">
                            <span className="trash-panel-title">Lixeira</span>
                            {trashItems.length > 0 && (
                                <button className="trash-empty-btn" onClick={onEmptyTrash}>Esvaziar</button>
                            )}
                        </div>
                        {trashItems.length === 0 && (
                            <p className="trash-empty-msg">A lixeira está vazia</p>
                        )}
                        <ul className="trash-list">
                            {[...trashItems].reverse().map((item, i) => (
                                <li key={i} className="trash-item">
                                    <div className="trash-item-info">
                                        <span className="trash-item-type">{TRASH_LABELS[item.type]}</span>
                                        <span className="trash-item-name">{item.label}</span>
                                    </div>
                                    <button className="trash-restore-btn" onClick={() => onRestoreFromTrash(item)}>
                                        Restaurar
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <button
                    className={`footer-button${searchOpen ? ' footer-button--active' : ''}`}
                    onClick={() => { setSearchOpen(prev => !prev); setTrashOpen(false) }}
                >
                    <img src={search} alt="" className="icon" />
                    <p>Pesquisar</p>
                </button>
                <button
                    className={`footer-button${trashOpen ? ' footer-button--active' : ''}`}
                    onClick={() => { setTrashOpen(prev => !prev); setSearchOpen(false) }}
                >
                    <img src={trash} alt="" className="icon" />
                    <p>Lixeira {trashItems.length > 0 ? `(${trashItems.length})` : ''}</p>
                </button>
            </div>

        </aside>
    )
}

export default Sidebar
