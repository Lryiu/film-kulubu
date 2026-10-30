# MESAFE Seans Defteri — çalışma notları

MESAFE Film Kulübü'nün sitesi: https://film.lryiu.com
Kurucu ve ana moderatör: Lryiu (Gamze Güçkıran Chartrand Cossette).
Bu dosya sitede yayımlanmaz; bu depoda çalışacak her yeni sohbet için bir defterdir. İş bitince buradaki "Bekleyen işler" ve ilgili bölümler güncellenmelidir.

## Nasıl çalışıyoruz

- Lryiu linkleri ve metinleri sohbete verir, güncellemeleri Claude yapar. Admin sayfası (kulup-giris.html) da vardır ama seanslar genelde sohbet üzerinden eklenir.
- Büyük değişiklikler önce ayrı bir dalda (önizleme) hazırlanır, Lryiu onaylayınca `main`e alınır. `main`e giden her şey Vercel'de birkaç dakikada yayına girer.
- Küçük veri güncellemeleri (üye listesi gibi) onaylandıktan sonra doğrudan `main`e gönderilebilir.
- Lryiu tabloları okumakta zorlanır; açıklamalar düz anlatımla ya da somut örnekle yapılmalı. Acele etmeden, onun temposunda ilerlenmeli.

## Sitenin yapısı

- `index.html`: ana sayfa ve arşiv. Arşiv `data/seanslar.json`dan okunur.
- `data/seanslar.json`: her okumanın kaydı (no, film, tarih, katılımcı sayısı, Spotify linki, görsel, metin). Metinlerin imzası "~ MESAFE Film Kulübü".
- `build-seans.js`: her yayında her seans için `/seans/<film-adi>/` sayfasını ve `sitemap.xml`i üretir. Yeni bir statik sayfa eklenirse sitemap listesine de eklenmeli.
- `rehber/`, `manifesto/`, `uyelerimiz/`: statik sayfalar. Menü bu sayfaların her birinde ve `index.html`de elle yazılıdır; menü değişirse hepsi güncellenmeli.
- `data/uyeler.json`: üye listesi (aşağıda).

## Kulübün kuralları (rehberde yazılı)

- Okuma takvimi: sorular buluşmadan en geç 3 gün önce filmi seçen üyeye gönderilir, o da listeyi 2 gün önce grupta paylaşır; katılım en geç 1 gün önce bildirilir.
- Haber veren üye o okumada "izinli" sayılır ve hiçbir şey kaybetmez.
- Konuşma: her söz alışta en fazla iki dakika (serbest tartışmada da), söz kesilmez, sıra dışı söz Meet'teki el kaldır düğmesiyle istenir.
- Siteye "buluşma" denir; üye listesinde sayılan şey "okuma"dır (her buluşma bir filmin okuması).

## Üye listesi ve unvanlar

`data/uyeler.json` her okumadan sonra güncellenir. Her üyenin `durum` alanında okuma numarasına göre: `k` katıldı, `i` izinli, `d` dönüş yapmadı. Kaydı olmayan okumalar, üye henüz kulüpte değilken yapılmıştır (bu yüzden yeni üyelere geçmiş okumalar yazılmaz). Unvanlar, kupa ve "Dönüş bekleniyor" sayfada kendiliğinden hesaplanır.

- Unvanlar (katılım sayısıyla): Davetli 0, Seyirci 1–2, Müdavim 3–4, Sinefil 5–9, Loca 10+. Kurucu yalnızca Lryiu.
- Haklar birikir: Seyirci film önerir (havuza girer); Müdavim havuzdan film seçip eş-moderatör olur, bu iş müdavimler arasında sırayla döner; Sinefil yeni üye davet eder; Loca sezonda bir kez "ara seans" koyar ve sezon sonunda yılın filmini seçer.
- Tam kadro kupası: katıldığından beri hiç kaçırmayan üyede olur; kupa sahibi puan turunu açar.
- Son iki okumanın birinde `d` olan üye silik halde "Dönüş bekleniyor"a iner, hakları askıdadır. İkisinde de `d` olan listeden (ve WhatsApp grubundan) düşer. Döndüğünde geçmişiyle geri gelir.
- `sonSans: true`: kurallar 30 Ekim 2026'da yayına girdiği için bir kereye mahsus düşmeyip "Dönüş bekleniyor"da kalır.
- Mehdi Doğan ve Habibe Bıyıklı artık kulüpte değil; listede adları geçmez.
- Liste sırası: unvan, sonra katılım sayısı, sonra alfabe. Sitede tablo yok; kartlar ve ikonlar (bilet: katıldı, fincan: izinli, üstü çizili mesaj: dönüş yapmadı).

## Bekleyen işler

- **Mommy (5. okuma)**: okuma yapıldı ve üye listesinde sayılıyor, ama ses kaydı hazırlanıyor. Lryiu Spotify linkini ve metni verince `data/seanslar.json`a 5 numaralı seans olarak eklenecek.
- **Gülpembe Aydın**: `sonSans` ile "Dönüş bekleniyor"da. Bir sonraki okumada da dönüş yapmazsa listeden çıkarılacak (kaydı silinmez, `sonSans` kalkar).
- **Filmi kimin seçtiği**: geçmiş okumalarda bilinmiyor. Lryiu söylerse `sectigi` alanıyla kartlarda gösterilebilir (henüz sayfada gösterimi yok, eklenmesi gerekir).
