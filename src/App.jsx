import { useState, useEffect, useRef } from 'react'
import './app.css'
import './styles/global.css'

import Sidebar from './components/Sidebar'
import CharacterView from './components/CharacterView'
import menuArrow from './assets/menu-arrow.png'

const defaultData = {
    campaigns: [],
}

function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Excluir' }) {
    return (
        <div className="confirm-overlay">
            <div className="confirm-dialog">
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button className="confirm-btn confirm-btn--cancel" onClick={onCancel}>Cancelar</button>
                    <button className="confirm-btn confirm-btn--delete" onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    )
}

function App() {
    const [data, setData] = useState(() => {
        try {
            const saved = localStorage.getItem('rpg-data')
            const parsed = saved ? JSON.parse(saved) : null
            return parsed?.campaigns ? parsed : defaultData
        } catch {
            return defaultData
        }
    })

    const [selectedCampaignId, setSelectedCampaignId] = useState(null)
    const [selectedCharacterId, setSelectedCharacterId] = useState(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState(null) // { message, onConfirm }

    // Trash state (in-memory only)
    const [trash, setTrash] = useState([])
    // Each item: { type: 'campaign'|'character'|'folder', label, data, campaignId?, folderId? }

    useEffect(() => {
        localStorage.setItem('rpg-data', JSON.stringify(data))
    }, [data])

    const selectedCampaign = data.campaigns.find(c => c.id === selectedCampaignId) || null

    const selectedCharacter = selectedCampaign
        ? [
            ...(selectedCampaign.characters || []),
            ...(selectedCampaign.folders || []).flatMap(f => f.characters || [])
          ].find(c => c.id === selectedCharacterId) || null
        : null

    function askConfirm(message, onConfirm, confirmLabel = 'Excluir') {
        setConfirmDialog({ message, onConfirm, confirmLabel })
    }

    function handleConfirm() {
        if (confirmDialog) confirmDialog.onConfirm()
        setConfirmDialog(null)
    }

    function handleCancelConfirm() {
        setConfirmDialog(null)
    }

    // ── Export all data ──
    function handleExportAll() {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rpg-backup-${new Date().toISOString().slice(0,10)}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    // ── Import all data ──
    function handleImportAll(file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result)
                if (!parsed?.campaigns) { alert('Arquivo inválido.'); return }
                askConfirm('Importar substituirá todos os dados atuais. Continuar?', () => {
                    setData(parsed)
                    setSelectedCampaignId(null)
                    setSelectedCharacterId(null)
                }, 'Importar')
            } catch {
                alert('Erro ao ler o arquivo JSON.')
            }
        }
        reader.readAsText(file)
    }

    // ── Trash restore ──
    function handleRestoreFromTrash(item) {
        if (item.type === 'campaign') {
            setData(prev => ({ ...prev, campaigns: [...prev.campaigns, item.data] }))
        } else if (item.type === 'character') {
            setData(prev => ({
                ...prev,
                campaigns: prev.campaigns.map(c => {
                    if (c.id !== item.campaignId) return c
                    if (item.folderId === null) {
                        return { ...c, characters: [...(c.characters || []), item.data] }
                    }
                    return {
                        ...c,
                        folders: (c.folders || []).map(f =>
                            f.id !== item.folderId ? f : { ...f, characters: [...(f.characters || []), item.data] }
                        )
                    }
                })
            }))
        } else if (item.type === 'folder') {
            setData(prev => ({
                ...prev,
                campaigns: prev.campaigns.map(c =>
                    c.id !== item.campaignId ? c : { ...c, folders: [...(c.folders || []), item.data] }
                )
            }))
        }
        setTrash(prev => prev.filter(t => t !== item))
    }

    function handleEmptyTrash() {
        setTrash([])
    }

    // ── Campaigns ──
    function handleCreateCampaign(name) {
        const newCampaign = {
            id: 'camp-' + Date.now(),
            name,
            folders: [],
            characters: [],
        }
        setData(prev => ({ ...prev, campaigns: [...prev.campaigns, newCampaign] }))
        setSelectedCampaignId(newCampaign.id)
        setSelectedCharacterId(null)
    }

    function handleDeleteCampaign(id) {
        const camp = data.campaigns.find(c => c.id === id)
        askConfirm(`Excluir a campanha "${camp?.name}"?`, () => {
            setTrash(prev => [...prev, { type: 'campaign', label: camp.name, data: camp }])
            setData(prev => ({ ...prev, campaigns: prev.campaigns.filter(c => c.id !== id) }))
            if (selectedCampaignId === id) {
                setSelectedCampaignId(null)
                setSelectedCharacterId(null)
            }
        })
    }

    function handleRenameCampaign(id, name) {
        setData(prev => ({
            ...prev,
            campaigns: prev.campaigns.map(c => c.id === id ? { ...c, name } : c)
        }))
    }

    function handleSelectCampaign(id) {
        setSelectedCampaignId(id)
        setSelectedCharacterId(null)
    }

    function handleSelectCharacter(id) {
        setSelectedCharacterId(id)
    }

    function handleCreateFolder(name) {
        const newFolder = { id: 'folder-' + Date.now(), name, characters: [] }
        setData(prev => ({
            ...prev,
            campaigns: prev.campaigns.map(c =>
                c.id !== selectedCampaignId ? c : { ...c, folders: [...(c.folders || []), newFolder] }
            )
        }))
    }

    function handleDeleteFolder(folderId) {
        const camp = data.campaigns.find(c => c.id === selectedCampaignId)
        const fold = camp?.folders?.find(f => f.id === folderId)
        askConfirm(`Excluir a pasta "${fold?.name}"?`, () => {
            setTrash(prev => [...prev, { type: 'folder', label: fold.name, data: fold, campaignId: selectedCampaignId }])
            setData(prev => ({
                ...prev,
                campaigns: prev.campaigns.map(c =>
                    c.id !== selectedCampaignId ? c : { ...c, folders: (c.folders || []).filter(f => f.id !== folderId) }
                )
            }))
        })
    }

    function handleRenameFolder(folderId, name) {
        setData(prev => ({
            ...prev,
            campaigns: prev.campaigns.map(c =>
                c.id !== selectedCampaignId ? c : {
                    ...c,
                    folders: (c.folders || []).map(f => f.id === folderId ? { ...f, name } : f)
                }
            )
        }))
    }

    function handleCreateCharacter(folderId) {
        const newChar = {
            id: 'char-' + Date.now(),
            name: 'Nova ficha',
            loreItems: [],
            categories: [],
        }
        setData(prev => ({
            ...prev,
            campaigns: prev.campaigns.map(c => {
                if (c.id !== selectedCampaignId) return c
                if (folderId === null) {
                    return { ...c, characters: [...(c.characters || []), newChar] }
                }
                return {
                    ...c,
                    folders: (c.folders || []).map(f =>
                        f.id !== folderId ? f : { ...f, characters: [...(f.characters || []), newChar] }
                    )
                }
            })
        }))
        setSelectedCharacterId(newChar.id)
    }

    function handleDeleteCharacter(charId, folderId) {
        const camp = data.campaigns.find(c => c.id === selectedCampaignId)
        let char = null
        if (folderId === null) {
            char = camp?.characters?.find(ch => ch.id === charId)
        } else {
            char = camp?.folders?.find(f => f.id === folderId)?.characters?.find(ch => ch.id === charId)
        }
        askConfirm(`Excluir a ficha "${char?.name}"?`, () => {
            setTrash(prev => [...prev, { type: 'character', label: char.name, data: char, campaignId: selectedCampaignId, folderId }])
            setData(prev => ({
                ...prev,
                campaigns: prev.campaigns.map(c => {
                    if (c.id !== selectedCampaignId) return c
                    if (folderId === null) {
                        return { ...c, characters: (c.characters || []).filter(ch => ch.id !== charId) }
                    }
                    return {
                        ...c,
                        folders: (c.folders || []).map(f =>
                            f.id !== folderId ? f : { ...f, characters: (f.characters || []).filter(ch => ch.id !== charId) }
                        )
                    }
                })
            }))
            if (selectedCharacterId === charId) setSelectedCharacterId(null)
        })
    }

    function handleUpdateCharacter(updatedCharacter) {
        setData(prev => ({
            ...prev,
            campaigns: prev.campaigns.map(c => {
                if (c.id !== selectedCampaignId) return c
                return {
                    ...c,
                    characters: (c.characters || []).map(ch =>
                        ch.id === updatedCharacter.id ? updatedCharacter : ch
                    ),
                    folders: (c.folders || []).map(f => ({
                        ...f,
                        characters: (f.characters || []).map(ch =>
                            ch.id === updatedCharacter.id ? updatedCharacter : ch
                        )
                    }))
                }
            })
        }))
    }

    return (
        <div className={`app${sidebarOpen ? '' : ' app--sidebar-closed'}`}>
            {confirmDialog && (
                <ConfirmDialog
                    message={confirmDialog.message}
                    onConfirm={handleConfirm}
                    onCancel={handleCancelConfirm}
                    confirmLabel={confirmDialog.confirmLabel}
                />
            )}

            {sidebarOpen && (
                <Sidebar
                    campaigns={data.campaigns}
                    selectedCampaignId={selectedCampaignId}
                    selectedCharacterId={selectedCharacterId}
                    onSelectCampaign={handleSelectCampaign}
                    onSelectCharacter={handleSelectCharacter}
                    onCreateCampaign={handleCreateCampaign}
                    onDeleteCampaign={handleDeleteCampaign}
                    onRenameCampaign={handleRenameCampaign}
                    onCreateFolder={handleCreateFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onRenameFolder={handleRenameFolder}
                    onCreateCharacter={handleCreateCharacter}
                    onDeleteCharacter={handleDeleteCharacter}
                    onCloseSidebar={() => setSidebarOpen(false)}
                    trash={trash}
                    onRestoreFromTrash={handleRestoreFromTrash}
                    onEmptyTrash={handleEmptyTrash}
                />
            )}

            <main className="main-content">
                {!sidebarOpen && (
                    <button className="sidebar-open-button" onClick={() => setSidebarOpen(true)}>
                        <img src={menuArrow} alt="Abrir menu" className="icon icon--flip-h" />
                    </button>
                )}
                <CharacterView
                    character={selectedCharacter}
                    onUpdateCharacter={handleUpdateCharacter}
                    onExportAll={handleExportAll}
                    onImportAll={handleImportAll}
                />
            </main>
        </div>
    )
}

export default App
