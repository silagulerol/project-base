/* role priviliges alanlarını doldrumak için bir yetki yapısına/mekanizmasına ihtiyacımız var.bu yapıyı kurmak için hangi yetkilere (rollere) sahibiz bunları bilmemiz gerekiyor
 View, Update,Add, Delete yetkilendirmeleri olucak. Bu yetkiler şu alanlara: Users, Roles, User Profile, Categories, AuditLogs alanlarına göre değişecek.
 Bu yapıyı kurmalı sonrasında da gruplara ayırmalıyız
 */

 /** Bu objenin yaratılma amaçları:
  * 1.Frontend Arayüzü Dinamik Olur: Backend'den dönen privileges ve privGroups sayesinde frontend, her kullanıcıya sadece izinli olduğu alanları gösterir.
    2. Role-Based Access Control (RBAC) kurulumu kolaylaşır:
        Bu yapı sayesinde rollere bu key değerleri atanabilir. Örneğin:
            "Moderator" → sadece user_view, category_view
            "Admin" → tüm user_*, role_*, category_*
    3. Veri tabanı kontrolü merkezi hale gelir:
        Tüm yetkiler tek bir dosyada tutulur. Arayüz, kontrol sistemi ve API arasında senkron olur. Yetki eklemek/silmek merkezi olduğu için kolay yönetilir.

    USERS → Kullanıcı Yönetimi Yetkileri-Bu grup, sistemdeki kullanıcı hesaplarıyla ilgili işlemleri kontrol eden yetkileri içerir. Kullanıcı ekleme, güncelleme, silme, listeleme yetkilerini kapsar.
    ROLES → Rol Yönetimi Yetkileri- Bu grup, sistemdeki rollerin tanımlanması ve düzenlenmesi ile ilgili yetkileri kapsar.Admin", "Editör", "Moderatör" gibi rollerin eklenmesi, silinmesi gibi işlemler.
    CATEGORIES → Kategori Yönetimi Yetkileri- Bu grup, uygulamada kullanılan içerik, ürün, menü vb. kategoriler üzerinde işlem yetkilerini belirler. Örnek kullanım: Blog kategorisi silme, ürün kategorisi güncelleme vb.
    AUDITLOGS → Sistem İzleme ve Kayıt İnceleme Yetkileri- Bu grup, sistemde tutulan log kayıtlarını görme yetkisini kapsar.Kim ne zaman ne yaptı? Bu tür logları görebilmek için kullanılır.
  
        */
 module.exports = {
   
    // Privgroups dizisi elemanları rollerimizin gruplarını temsil eder. (Users, Roles, User Profile, Categories)
    privGroups: [
        {
            id:"USERS", 
            name: "User Permissions"
        },
        {
            id:"ROLES", 
            name: "Role Permissions"
        },
        {
            id:"CATEGORIES", 
            name: "Category Permissions"
        },
        {
            id:"AUDITLOGS", 
            name: "AuditLogs Permissions"
        }
    ],
    
    privileges: [
        /* verilecek yetkinin key'i : key
           arayüzde gösterilecek alan: name,
           hangi gruba atanmış bir yeki olduğunu belrtiğimiz: group
           ne işe yaradığı: description
        */
        {
            key:"user_view",
            name:"User View",
            group:"USERS",
            description:"User view"
        },
         {
            key:"user_add",
            name:"User Add",
            group:"USERS",
            description:"User add"
        },
         {
            key:"user_update",
            name:"User Update",
            group:"USERS",
            description:"User update"
        },
         {
            key:"user_delete",
            name:"User Delete",
            group:"USERS",
            description:"User delete"
        },
        {
            key:"role_view",
            name:"Role View",
            group:"ROLES",
            description:"Role view"
        },
         {
            key:"role_add",
            name:"Role Add",
            group:"ROLES",
            description:"Role add"
        },
         {
            key:"role_update",
            name:"Role Update",
            group:"ROLES",
            description:"Role update"
        },
         {
            key:"role_delete",
            name:"Role Delete",
            group:"ROLES",
            description:"Role delete"
        },
        {
            key:"category_view",
            name:"Category View",
            group:"CATEGORIES",
            description:"Category view"
        },
         {
            key:"category_add",
            name:"Category Add",
            group:"CATEGORIES",
            description:"Category add"
        },
         {
            key:"category_update",
            name:"Category Update",
            group:"CATEGORIES",
            description:"Category update"
        },
         {
            key:"category_delete",
            name:"Auditlogs Delete",
            group:"CATEGORIES",
            description:"Auditlogs delete"
        },
        {
            key:"auditlogs_view",
            name:"AuditLogs View",
            group:"AUDITLOGS",
            description:"AuditLogs view"
        }
        
    ]

    
}
