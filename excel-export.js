// Excel Export Module using ExcelJS
// Feature 2/10: Export Excel amélioré avec multi-feuilles et formatage

async function exportToExcel() {
    if (items.length === 0) {
        showToast('Erreur', 'Aucune donnée à exporter', 'error');
        return;
    }

    try {
        // Import ExcelJS from CDN or use local module
        const ExcelJS = window.ExcelJS;

        if (!ExcelJS) {
            showToast('Erreur', 'Bibliothèque ExcelJS non chargée', 'error');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Gestion Stock IT';
        workbook.created = new Date();

        // ===== SHEET 1: ARTICLES =====
        const sheetArticles = workbook.addWorksheet('Articles', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });

        // Définir les colonnes
        sheetArticles.columns = [
            { header: 'ID', key: 'id', width: 8 },
            { header: 'Nom', key: 'name', width: 30 },
            { header: 'Modèle', key: 'model', width: 25 },
            { header: 'Catégorie', key: 'category', width: 20 },
            { header: 'Quantité', key: 'quantity', width: 12 },
            { header: 'Seuil alerte', key: 'alert_threshold', width: 12 },
            { header: 'Statut', key: 'status', width: 15 },
            { header: 'N° Série', key: 'serial', width: 20 },
            { header: 'Emplacement', key: 'location', width: 25 },
            { header: 'Fournisseur', key: 'supplier', width: 25 },
            { header: 'Date achat', key: 'purchase_date', width: 15 },
            { header: 'Prix unitaire', key: 'price', width: 15 },
            { header: 'Valeur totale', key: 'total_value', width: 15 },
            { header: 'Notes', key: 'notes', width: 40 }
        ];

        // Style du header
        const headerRow = sheetArticles.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        // Ajouter les données
        items.forEach(item => {
            const categoryLabels = {
                'informatique': 'Informatique',
                'peripheriques': 'Périphériques',
                'ecrans': 'Écrans',
                'connectique': 'Connectique',
                'alimentation': 'Alimentation',
                'docking': 'Docking & Hubs',
                'audio': 'Audio',
                'reseau': 'Réseau',
                'stockage': 'Stockage',
                'mobile': 'Mobile'
            };

            let status = 'En stock';
            if (item.quantity === 0) status = 'Épuisé';
            else if (item.quantity <= item.alert_threshold) status = 'Stock faible';

            const row = sheetArticles.addRow({
                id: item.id,
                name: item.name,
                model: item.model || '-',
                category: categoryLabels[item.category] || item.category,
                quantity: item.quantity,
                alert_threshold: item.alert_threshold,
                status: status,
                serial: item.serial || '-',
                location: item.location || '-',
                supplier: item.supplier || '-',
                purchase_date: item.purchase_date ? new Date(item.purchase_date).toLocaleDateString('fr-CH') : '-',
                price: item.price || 0,
                total_value: item.quantity * (item.price || 0),
                notes: item.notes || '-'
            });

            // Colorer selon le statut
            const statusCell = row.getCell('status');
            if (status === 'Épuisé') {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFF6B6B' }
                };
                statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            } else if (status === 'Stock faible') {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFD93D' }
                };
                statusCell.font = { bold: true };
            } else {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF95E1D3' }
                };
            }

            // Format monétaire pour prix et valeur totale
            row.getCell('price').numFmt = '#,##0.00 "CHF"';
            row.getCell('total_value').numFmt = '#,##0.00 "CHF"';
        });

        // Ajouter des bordures à toutes les cellules
        sheetArticles.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
                };
            });
        });

        // Ajouter ligne de totaux
        const totalRow = sheetArticles.addRow({
            id: '',
            name: 'TOTAUX',
            model: '',
            category: '',
            quantity: { formula: `SUM(E2:E${items.length + 1})` },
            alert_threshold: '',
            status: '',
            serial: '',
            location: '',
            supplier: '',
            purchase_date: '',
            price: '',
            total_value: { formula: `SUM(M2:M${items.length + 1})` },
            notes: ''
        });

        totalRow.font = { bold: true, size: 12 };
        totalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE7E6E6' }
        };
        totalRow.getCell('total_value').numFmt = '#,##0.00 "CHF"';

        // ===== SHEET 2: HISTORIQUE =====
        const sheetHistory = workbook.addWorksheet('Historique', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });

        sheetHistory.columns = [
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Article', key: 'item_name', width: 30 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Quantité', key: 'quantity', width: 12 },
            { header: 'Stock après', key: 'stock_after', width: 12 },
            { header: 'Personne', key: 'person', width: 25 },
            { header: 'Note', key: 'note', width: 40 }
        ];

        // Style du header
        const historyHeaderRow = sheetHistory.getRow(1);
        historyHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        historyHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF70AD47' }
        };
        historyHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
        historyHeaderRow.height = 25;

        // Collecter tous les mouvements d'historique
        const allHistory = [];
        items.forEach(item => {
            if (item.history && item.history.length > 0) {
                item.history.forEach(h => {
                    allHistory.push({
                        date: new Date(h.date),
                        item_name: item.name,
                        type: h.type === 'add' ? 'Ajout' : h.type === 'remove' ? 'Retrait' : h.type,
                        quantity: h.quantity,
                        stock_after: h.quantityAfter,
                        person: h.person || '-',
                        note: h.note || '-'
                    });
                });
            }
        });

        // Trier par date décroissante
        allHistory.sort((a, b) => b.date - a.date);

        // Ajouter les données
        allHistory.forEach(h => {
            const row = sheetHistory.addRow({
                date: h.date.toLocaleString('fr-CH'),
                item_name: h.item_name,
                type: h.type,
                quantity: h.quantity,
                stock_after: h.stock_after,
                person: h.person,
                note: h.note
            });

            // Colorer selon le type
            const typeCell = row.getCell('type');
            if (h.type === 'Ajout') {
                typeCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF95E1D3' }
                };
            } else if (h.type === 'Retrait') {
                typeCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFD93D' }
                };
            }

            // Bordures
            row.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
                };
            });
        });

        // ===== SHEET 3: STATISTIQUES =====
        const sheetStats = workbook.addWorksheet('Statistiques');

        // Titre
        sheetStats.mergeCells('A1:D1');
        const titleCell = sheetStats.getCell('A1');
        titleCell.value = '📊 STATISTIQUES GLOBALES';
        titleCell.font = { bold: true, size: 16, color: { argb: 'FF4472C4' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE7E6E6' }
        };
        sheetStats.getRow(1).height = 30;

        // Statistiques
        const stats = [
            ['', '', '', ''],
            ['Métrique', 'Valeur', '', ''],
            ['', '', '', ''],
            ['Nombre total d\'articles différents', items.length, '', ''],
            ['Unités totales en stock', items.reduce((sum, i) => sum + i.quantity, 0), '', ''],
            ['Articles en stock', items.filter(i => i.quantity > 0).length, '', ''],
            ['Articles épuisés', items.filter(i => i.quantity === 0).length, '', ''],
            ['Articles en alerte de stock', items.filter(i => i.quantity > 0 && i.quantity <= i.alert_threshold).length, '', ''],
            ['Valeur totale du stock', items.reduce((sum, i) => sum + (i.quantity * (i.price || 0)), 0), 'CHF', ''],
            ['Prix moyen par article', items.length > 0 ? items.reduce((sum, i) => sum + (i.price || 0), 0) / items.length : 0, 'CHF', '']
        ];

        stats.forEach((stat, index) => {
            if (index === 1) {
                // Header des stats
                const row = sheetStats.addRow(stat);
                row.font = { bold: true, size: 12 };
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4472C4' }
                };
                row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                row.getCell(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            } else if (index > 2) {
                const row = sheetStats.addRow(stat);
                row.getCell(2).numFmt = typeof stat[1] === 'number' && stat[2] === 'CHF' ? '#,##0.00 "CHF"' : '#,##0';

                // Couleurs alternées
                if (index % 2 === 0) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' }
                    };
                }
            } else {
                sheetStats.addRow(stat);
            }
        });

        sheetStats.getColumn(1).width = 40;
        sheetStats.getColumn(2).width = 20;

        // Générer le fichier
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `stock_export_${timestamp}.xlsx`;
        link.click();

        window.URL.revokeObjectURL(url);

        showToast('Succès', 'Export Excel créé avec succès!', 'success');

    } catch (error) {
        console.error('Erreur lors de l\'export Excel:', error);
        showToast('Erreur', 'Erreur lors de l\'export: ' + error.message, 'error');
    }
}
