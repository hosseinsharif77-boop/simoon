/**
 * Simoon Cafe Admin Panel - Special Carousel Management
 */
(function(admin) {
    'use strict';

    // state برای نگهداری اسلایدهای کاروسل ویژه
    admin.state.specialSlides = [];

    // تابع برای واکشی اسلایدهای کاروسل از سرور
    admin.fetchSpecialSlides = async function() {
        console.log('\n\n===== 🎠 [ADMIN] Fetching special carousel slides =====');
        try {
            const response = await fetch(`${admin.API_URL}/admin/special-slides`);
            if (!response.ok) throw new Error(`Server Error: ${response.status}`);
            
            const data = await response.json();
            admin.state.specialSlides = data;
            console.log('✅ Special slides received:', admin.state.specialSlides);
            admin.renderSpecialSlidesManagement();
        } catch (error) {
            console.error('!!! ERROR fetching special slides !!!', error.message);
            admin.showNotification('Error fetching special slides!', 'error');
        }
    };

    // تابع برای رندر کردن کارت‌های مدیریت اسلایدها در ادمین
    admin.renderSpecialSlidesManagement = function() {
        const container = document.getElementById('special-slides-container');
        if (!container) return;

        let html = '';
        if (admin.state.specialSlides.length === 0) {
            html = '<div class="col-12"><div class="alert alert-info text-center">No slides in the special carousel. Add one!</div></div>';
        } else {
            admin.state.specialSlides.forEach((slide, index) => {
                html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card special-slide-card" data-slide-id="${slide.id}">
                            <img src="${slide.image_url}" class="card-img-top" alt="${slide.title}">
                            <div class="card-body">
                                <h5 class="card-title">${slide.title}</h5>
                                <p class="card-text">${slide.description}</p>
                                <div class="d-flex justify-content-between">
                                    <button class="btn btn-sm btn-warning edit-special-slide-btn" data-slide-id="${slide.id}">
                                        <i class="bi bi-pencil"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger delete-special-slide-btn" data-slide-id="${slide.id}">
                                        <i class="bi bi-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        container.innerHTML = html;

        // اضافه کردن رویدادهای کلیک به دکمه‌های ویرایش و حذف
        document.querySelectorAll('.edit-special-slide-btn').forEach(btn => {
            btn.addEventListener('click', () => admin.openEditSpecialSlideModal(btn.getAttribute('data-slide-id')));
        });

        document.querySelectorAll('.delete-special-slide-btn').forEach(btn => {
            btn.addEventListener('click', () => admin.confirmDeleteSpecialSlide(btn.getAttribute('data-slide-id')));
        });
    };

    // تابع برای باز کردن مودال افزودن اسلاید جدید
    admin.openAddSpecialSlideModal = function() {
        const existingModal = bootstrap.Modal.getInstance(document.getElementById('specialSlideModal'));
        if (existingModal) existingModal.dispose();

        admin.state.currentEditingSlideId = null;
        document.getElementById('specialSlideModalLabel').innerText = 'Add New Carousel Slide';
        document.getElementById('specialSlideForm').reset();
        document.getElementById('deleteSpecialSlideBtn').style.display = 'none';
        
        const modal = new bootstrap.Modal(document.getElementById('specialSlideModal'));
        modal.show();
    };

    // تابع برای باز کردن مودال ویرایش اسلاید
    admin.openEditSpecialSlideModal = async function(slideId) {
        const existingModal = bootstrap.Modal.getInstance(document.getElementById('specialSlideModal'));
        if (existingModal) existingModal.dispose();

        admin.state.currentEditingSlideId = slideId;
        const slide = admin.state.specialSlides.find(s => s.id == slideId);
        
        if (!slide) {
            admin.showNotification('Slide not found!', 'error');
            return;
        }

        document.getElementById('specialSlideModalLabel').innerText = 'Edit Carousel Slide';
        document.getElementById('specialSlideId').value = slide.id;
        document.getElementById('specialSlideImageUrl').value = slide.image_url;
        document.getElementById('specialSlideTitle').value = slide.title;
        document.getElementById('specialSlideDescription').value = slide.description;
        document.getElementById('deleteSpecialSlideBtn').style.display = 'block';

        const modal = new bootstrap.Modal(document.getElementById('specialSlideModal'));
        modal.show();
    };

    // تابع برای ذخیره اسلاید (افزودن یا ویرایش)
    admin.saveSpecialSlide = async function() {
        const slideId = document.getElementById('specialSlideId').value;
        const slideData = {
            image_url: document.getElementById('specialSlideImageUrl').value.trim(),
            title: document.getElementById('specialSlideTitle').value.trim(),
            description: document.getElementById('specialSlideDescription').value.trim()
        };

        if (!slideData.image_url || !slideData.title || !slideData.description) {
            admin.showNotification('Please fill in all fields.', 'error');
            return;
        }

        try {
            let response;
            if (slideId) {
                // ویرایش اسلاید موجود
                response = await fetch(`${admin.API_URL}/admin/special-slides/${slideId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(slideData)
                });
            } else {
                // افزودن اسلاید جدید
                response = await fetch(`${admin.API_URL}/admin/special-slides`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(slideData)
                });
            }

            if (response.ok) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('specialSlideModal'));
                modal.hide();
                
                admin.showNotification(`Slide successfully ${slideId ? 'updated' : 'added'}!`, 'success');
                await admin.fetchSpecialSlides(); // واکشی مجدد و رندر کردن اسلایدها
            } else {
                const errorData = await response.json();
                admin.showNotification(`Error: ${errorData.message}`, 'error');
            }
        } catch (error) {
            console.error('!!! ERROR saving special slide !!!', error.message);
            admin.showNotification('Error communicating with server!', 'error');
        }
    };

    // تابع برای تایید حذف اسلاید
    admin.confirmDeleteSpecialSlide = function(slideId) {
        admin.showConfirmDialog(
            'Are you sure you want to delete this slide?',
            () => admin.deleteSpecialSlide(slideId),
            { title: 'Delete Slide', okText: 'Delete', okClass: 'btn-danger' }
        );
    };

    // تابع برای حذف اسلاید
    admin.deleteSpecialSlide = async function(slideId) {
        try {
            const response = await fetch(`${admin.API_URL}/admin/special-slides/${slideId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                admin.showNotification('Slide successfully deleted!', 'success');
                await admin.fetchSpecialSlides(); // واکشی مجدد و رندر کردن اسلایدها
            } else {
                const errorData = await response.json();
                admin.showNotification(`Error: ${errorData.message}`, 'error');
            }
        } catch (error) {
            console.error('!!! ERROR deleting special slide !!!', error.message);
            admin.showNotification('Error communicating with server!', 'error');
        }
    };

    // تابع برای نمایش/مخفی کردن بخش مدیریت کاروسل
    admin.toggleSpecialCarouselManagement = function(isVisible) {
        const managementDiv = document.getElementById('special-carousel-management');
        if (managementDiv) {
            managementDiv.style.display = isVisible ? 'block' : 'none';
        }
    };

    // رویدادها را پس از بارگذاری DOM تنظیم می‌کنیم
    document.addEventListener('DOMContentLoaded', function() {
        const addSlideBtn = document.getElementById('add-special-slide-btn');
        if (addSlideBtn) {
            addSlideBtn.addEventListener('click', admin.openAddSpecialSlideModal);
        }

        const saveSlideBtn = document.getElementById('saveSpecialSlideBtn');
        if (saveSlideBtn) {
            saveSlideBtn.addEventListener('click', admin.saveSpecialSlide);
        }
    });

})(window.SimoonAdmin);