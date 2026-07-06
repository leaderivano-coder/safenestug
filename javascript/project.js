
        // Load reports from localStorage
        let reports = JSON.parse(localStorage.getItem('childAbuseReports')) || [];
        
        // Media storage
        let mediaFiles = [];

        // DOM Elements
        const reportForm = document.getElementById('reportForm');
        const mediaUploadArea = document.getElementById('mediaUploadArea');
        const mediaInput = document.getElementById('mediaInput');
        const mediaPreview = document.getElementById('mediaPreview');
        const reportsList = document.getElementById('reportsList');
        const searchReports = document.getElementById('searchReports');
        const statusFilter = document.getElementById('statusFilter');

        // Update stats
        function updateStats() {
            document.getElementById('totalReports').textContent = reports.length;
            document.getElementById('pendingReports').textContent = reports.filter(r => r.status === 'pending').length;
            document.getElementById('investigatingReports').textContent = reports.filter(r => r.status === 'investigating').length;
            document.getElementById('resolvedReports').textContent = reports.filter(r => r.status === 'resolved').length;
        }

        // Show alert
        function showAlert(message, type = 'success') {
            const alert = document.getElementById('alert');
            alert.textContent = message;
            alert.className = `alert alert-${type}`;
            alert.style.display = 'block';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 3000);
        }

        // Handle media upload
        mediaUploadArea.addEventListener('click', () => {
            mediaInput.click();
        });

        mediaUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            mediaUploadArea.style.borderColor = '#3b82f6';
        });

        mediaUploadArea.addEventListener('dragleave', () => {
            mediaUploadArea.style.borderColor = '#cbd5e1';
        });

        mediaUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            mediaUploadArea.style.borderColor = '#cbd5e1';
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        });

        mediaInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            handleFiles(files);
        });

        function handleFiles(files) {
            files.forEach(file => {
                if (file.size > 10 * 1024 * 1024) {
                    showAlert(`File ${file.name} exceeds 10MB limit`, 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const mediaData = {
                        id: Date.now() + Math.random(),
                        type: file.type.startsWith('image/') ? 'image' : 'video',
                        data: e.target.result,
                        name: file.name
                    };
                    mediaFiles.push(mediaData);
                    displayMediaPreview();
                };
                reader.readAsDataURL(file);
            });
        }

        function displayMediaPreview() {
            mediaPreview.innerHTML = mediaFiles.map(media => `
                <div class="media-item">
                    ${media.type === 'image' ? 
                        `<img src="${media.data}" alt="Preview">` : 
                        `<video src="${media.data}"></video>`
                    }
                    <button class="remove-media" onclick="removeMedia('${media.id}')">×</button>
                </div>
            `).join('');
        }

        window.removeMedia = (id) => {
            mediaFiles = mediaFiles.filter(m => m.id != id);
            displayMediaPreview();
        };

        // Submit report
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const report = {
                id: 'RPT-' + Date.now(),
                reporterName: document.getElementById('reporterName').value || 'Anonymous',
                childName: document.getElementById('childName').value,
                childAge: document.getElementById('childAge').value,
                location: document.getElementById('location').value,
                abuseType: document.getElementById('abuseType').value,
                description: document.getElementById('description').value,
                contactEmail: document.getElementById('contactEmail').value || 'Not provided',
                media: mediaFiles.map(m => ({ type: m.type, data: m.data })),
                status: 'pending',
                date: new Date().toLocaleString(),
                dateTimestamp: Date.now()
            };
            
            reports.unshift(report);
            localStorage.setItem('childAbuseReports', JSON.stringify(reports));
            
            // Reset form
            reportForm.reset();
            mediaFiles = [];
            displayMediaPreview();
            
            updateStats();
            displayReports();
            showAlert('Report submitted successfully! Authorities have been notified.', 'success');
        });

        // Display reports
        function displayReports() {
            let filteredReports = [...reports];
            
            const searchTerm = searchReports.value.toLowerCase();
            const status = statusFilter.value;
            
            if (searchTerm) {
                filteredReports = filteredReports.filter(r => 
                    r.childName.toLowerCase().includes(searchTerm) || 
                    r.location.toLowerCase().includes(searchTerm)
                );
            }
            
            if (status !== 'all') {
                filteredReports = filteredReports.filter(r => r.status === status);
            }
            
            if (filteredReports.length === 0) {
                reportsList.innerHTML = '<p style="text-align: center; color: #64748b;">No reports found.</p>';
                return;
            }
            
            reportsList.innerHTML = filteredReports.map(report => `
                <div class="report-item">
                    <div class="report-header">
                        <div>
                            <span class="report-id">${report.id}</span>
                            <span class="report-date"> | ${report.date}</span>
                        </div>
                        <span class="report-status status-${report.status}">
                            ${report.status === 'pending' ? 'Pending Review' : 
                              report.status === 'investigating' ? 'Under Investigation' : 'Resolved'}
                        </span>
                    </div>
                    <div class="report-details">
                        <strong>Child:</strong> ${report.childName} (Age ${report.childAge})<br>
                        <strong>Location:</strong> ${report.location}<br>
                        <strong>Abuse Type:</strong> ${report.abuseType}<br>
                        <strong>Description:</strong> ${report.description.substring(0, 100)}${report.description.length > 100 ? '...' : ''}
                    </div>
                    ${report.media && report.media.length > 0 ? `
                        <div class="report-media">
                            ${report.media.slice(0, 4).map(media => `
                                ${media.type === 'image' ? 
                                    `<img src="${media.data}" onclick="viewMedia('${media.data}', 'image')">` : 
                                    `<video src="${media.data}" onclick="viewMedia('${media.data}', 'video')"></video>`
                                }
                            `).join('')}
                            ${report.media.length > 4 ? `<span>+${report.media.length - 4} more</span>` : ''}
                        </div>
                    ` : ''}
                    <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                        Reported by: ${report.reporterName}
                    </div>
                </div>
            `).join('');
        }
        
        // View media in modal
        window.viewMedia = (data, type) => {
            const modal = document.getElementById('mediaModal');
            const modalContent = document.getElementById('modalContent');
            if (type === 'image') {
                modalContent.innerHTML = `<img src="${data}" alt="Evidence">`;
            } else {
                modalContent.innerHTML = `<video src="${data}" controls autoplay></video>`;
            }
            modal.style.display = 'flex';
        };
        
        // Close modal
        document.querySelector('.close-modal').onclick = () => {
            document.getElementById('mediaModal').style.display = 'none';
        };
        
        window.onclick = (e) => {
            const modal = document.getElementById('mediaModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Search and filter
        searchReports.addEventListener('input', () => displayReports());
        statusFilter.addEventListener('change', () => displayReports());
        
        // Initialize
        updateStats();
        displayReports();
        
        // Auto-update status (simulate investigation process)
        setInterval(() => {
            let updated = false;
            reports = reports.map(report => {
                if (report.status === 'pending' && (Date.now() - report.dateTimestamp) > 86400000) {
                    updated = true;
                    return { ...report, status: 'investigating' };
                }
                if (report.status === 'investigating' && (Date.now() - report.dateTimestamp) > 604800000) {
                    updated = true;
                    return { ...report, status: 'resolved' };
                }
                return report;
            });
            if (updated) {
                localStorage.setItem('childAbuseReports', JSON.stringify(reports));
                updateStats();
                displayReports();
            }
        }, 60000);
  