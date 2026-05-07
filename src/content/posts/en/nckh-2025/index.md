---
title: "Công cụ trích xuất thông tin từ hình ảnh phục vụ điều tra số"
description: "Bài viết trình bày kỹ thuật steganography trên PNG và JPEG, cùng công cụ điều tra số tích hợp 8 module và AI Agent DeepSeek."
pubDate: 2025-05-08
tags:
  - NCKH
translationKey: nckh-2025
toc: true
draft: false
---

# Công cụ trích xuất thông tin từ hình ảnh phục vụ điều tra số

> **Tóm tắt:** Bài viết giới thiệu cách ẩn và trích xuất thông tin trong ảnh PNG/JPEG, đồng thời mô tả một công cụ điều tra số viết bằng C# .NET 8 WinForms. Ứng dụng tích hợp 8 module: Steghide, ExifTool, Bit-plane (LSB/MSB) Extractor, Shift Bit Color, XOR Comparator, Edit Size Picture, PowerShell Extractor và AI Agent dùng DeepSeek SDK.

**Tác giả:** [Lê Nhựt Quốc Khang](https://raviyelna.github.io/), Hồ Minh Huy

---

## Mục lục

1. [Giới Thiệu](#1-giới-thiệu)
2. [Nền Tảng Lý Thuyết: PNG và JPEG](#2-nền-tảng-lý-thuyết-png-và-jpeg)
3. [Nguyên Lý Ẩn Giấu và Trích Xuất Thông Tin — Chi Tiết Từng Công Cụ](#3-nguyên-lý-ẩn-giấu-và-trích-xuất-thông-tin)
4. [Ứng Dụng Trong Điều Tra Số](#4-ứng-dụng-trong-điều-tra-số)
5. [Mô Tả Giao Diện Ứng Dụng](#5-mô-tả-giao-diện-ứng-dụng)
6. [Nhận Diện Ảnh Có Ẩn Giấu Thông Tin](#6-nhận-diện-ảnh-có-ẩn-giấu-thông-tin)
7. [Kết Quả Thực Nghiệm](#7-kết-quả-thực-nghiệm)
8. [Đánh Giá](#8-đánh-giá)
9. [Kết Luận](#9-kết-luận)

---

## 1. Giới Thiệu

Trong thế giới số ngày nay, một bức ảnh có thể ẩn chứa nhiều hơn những gì mắt thường nhìn thấy. **Steganography** (thuật giấu tin) là nghệ thuật và khoa học nhúng thông tin bí mật vào các tệp phương tiện — ảnh, âm thanh, video — sao cho sự tồn tại của thông tin đó không bị phát hiện.

Steganography khác với mã hóa (*cryptography*) ở điểm cốt lõi: mã hóa che giấu *nội dung* của thông tin, còn steganography che giấu *sự tồn tại* của chính thông tin đó. Nhờ đặc điểm này, một kẻ tấn công có thể truyền đi bí mật quốc gia ngay trong một bức ảnh phong cảnh bình thường, hoặc giấu toàn bộ tài liệu mật bên trong một file ảnh JPEG trông hoàn toàn vô hại.

Trong lĩnh vực **điều tra số (digital forensics)** và **CTF (Capture The Flag)**, steganography là một trong những kỹ thuật phổ biến nhất — và cũng là thách thức khó giải quyết nhất nếu điều tra viên không có công cụ phù hợp.

Bài viết này giới thiệu một công cụ điều tra số tích hợp được phát triển bằng **C# .NET 8 WinForms**, tích hợp 8 module phân tích steganography khác nhau, và đặc biệt được trang bị **AI Agent** sử dụng DeepSeek để tự động hóa quá trình phân tích kết quả.

---

## 2. Cơ sở lý thuyết

Để hiểu được cách thức ẩn giấu thông tin, trước tiên cần nắm rõ cấu trúc của các định dạng ảnh phổ biến nhất.

### 2.1. Định Dạng PNG — *Portable Network Graphics*

PNG là định dạng ảnh **lossless** (nén không mất dữ liệu), sử dụng thuật toán DEFLATE. Điểm quan trọng cần ghi nhớ là: vì không mất dữ liệu trong quá trình nén, PNG bảo toàn hoàn toàn giá trị từng pixel — đây là đặc tính lý tưởng để thực hiện steganography ở cấp độ bit.

**Cấu trúc file PNG:**

![Cấu trúc file PNG](/posts/nckh-2025/attachments/png_structor.png)

```
[8 bytes PNG Signature] [IHDR Chunk] [Other Chunks...] [IDAT Chunk(s)] [IEND Chunk]
```

- **Magic bytes (PNG Signature)**: `89 50 4E 47 0D 0A 1A 0A`
  - `89`: Byte không phải ASCII, có tác dụng ngăn file bị mở nhầm như tệp văn bản
  - `50 4E 47`: Chuỗi ASCII "PNG"
  - Phần còn lại: Dùng để kiểm tra lỗi trong quá trình truyền dữ liệu (CRLF, EOF)

- **Cấu trúc mỗi Chunk**: `[Length: 4B] [Type: 4B] [Data: Length bytes] [CRC: 4B]`

- **Chunk IHDR** (luôn là chunk đầu tiên):
  - Bytes 8–11: Length = `00 00 00 0D` (13 bytes data)
  - Bytes 12–15: Type = `49 48 44 52` ("IHDR")
  - **Bytes 16–19: Width** (số nguyên 32-bit không dấu, big-endian)
  - **Bytes 20–23: Height** (số nguyên 32-bit không dấu, big-endian)
  - Bytes 24–28: Bit depth, Color type, Compression, Filter, Interlace

> **Ý nghĩa thực tế**: Bytes 16–23 là vị trí then chốt cần chú ý. Trong các bài CTF, người ra đề thường giảm giá trị Height trong IHDR để che giấu phần dưới của ảnh — phần bị ẩn vẫn tồn tại đầy đủ trong file, nhưng các trình xem ảnh thông thường sẽ không hiển thị nó.

**Ví dụ thực tế (đọc từ code `ReadImageHexBytes()`):**
```
Kiểm tra magic bytes: imageBytes[0]==0x89 && [1]==0x50 && [2]==0x4E && [3]==0x47
→ Width:  imageBytes[16], [17], [18], [19]  (4 bytes big-endian)
→ Height: imageBytes[20], [21], [22], [23]  (4 bytes big-endian)
```

---

### 2.2 Định Dạng JPEG — *Joint Photographic Experts Group*

JPEG là định dạng **lossy** (nén mất dữ liệu), sử dụng biến đổi DCT (Discrete Cosine Transform). Do quá trình nén làm biến đổi giá trị pixel, việc nhúng và trích xuất thông tin ẩn ở cấp độ pixel trong JPEG trở nên rất khó thực hiện. Tuy nhiên, JPEG hỗ trợ metadata EXIF khá phong phú — và đây chính là nơi thường bị khai thác để ẩn giấu thông tin.

**Cấu trúc file JPEG:**

![Cấu trúc file JPEG](/posts/nckh-2025/attachments/jpeg_structor.png)

```
[SOI: FF D8] [APP0/APP1 Segments...] [SOF Segment] [DHT] [SOS] [Compressed Data] [EOI: FF D9]
```

- **Magic bytes (SOI — Start of Image)**: `FF D8 FF`

- **Cấu trúc mỗi Segment**: `[Marker: 2B] [Length: 2B] [Data]`

- **Segment SOF (Start of Frame)** — chứa thông tin kích thước ảnh:
  - Các marker nhận dạng: `FF C0` (SOF0 - Baseline DCT), `FF C1` (SOF1), `FF C2` (SOF2), `FF C3` (SOF3)
  - Tại vị trí offset `i` có marker SOF:
    - `imageBytes[i+5], [i+6]`: **Height** (2 bytes, big-endian)
    - `imageBytes[i+7], [i+8]`: **Width** (2 bytes, big-endian)

**Ví dụ thực tế (đọc từ code `ReadImageHexBytes()`):**
```csharp
// Tìm SOF marker
while (i < imageBytes.Length - 9) {
    if (imageBytes[i] == 0xFF && imageBytes[i+1] >= 0xC0 && imageBytes[i+1] <= 0xC3) {
        // Tìm thấy SOF segment
        Width  = imageBytes[i+7], imageBytes[i+8]  // 2 bytes
        Height = imageBytes[i+5], imageBytes[i+6]  // 2 bytes
        break;
    }
    i++;
}
```

---

### 2.3 Tại Sao Các Tệp Hình Ảnh Là Phương Tiện Ẩn Giấu Lý Tưởng?

Các tệp hình ảnh được ưa chuộng làm phương tiện ẩn giấu thông tin vì bốn lý do chính:

1. **Dung lượng lớn**: Một ảnh 1920×1080 RGB có khoảng 6MB dữ liệu thô, tức là đủ sức chứa hàng trăm KB payload ẩn.
2. **Giới hạn nhận thức của mắt người**: Mắt người không thể nhận ra sự thay đổi ở 1–2 bit thấp nhất của mỗi kênh màu, nên ảnh trông vẫn hoàn toàn bình thường sau khi nhúng dữ liệu.
3. **Phổ biến và không gây nghi ngờ**: Một file ảnh không tạo ra bất kỳ dấu hiệu đáng ngờ nào khi được truyền qua email hay mạng xã hội.
4. **Nhiều phương pháp ẩn giấu khác nhau**: Có thể áp dụng LSB, MSB, EOF append, metadata, palette manipulation, hay DCT coefficient modification.

---

## 3. Nguyên Lý Ẩn Giấu và Trích Xuất Thông Tin

---

### 3.1 Steghide — Ẩn Giấu Có Mật Khẩu

**Steghide** là công cụ steganography mã nguồn mở nổi tiếng, hỗ trợ nhúng dữ liệu có mã hóa vào ảnh JPEG và BMP.

#### Nguyên lý hoạt động

Steghide sử dụng phương pháp **graph-based steganography**, hoạt động theo các bước sau:
1. Dữ liệu cần nhúng được mã hóa bằng **AES-128** (hoặc các thuật toán khác tùy cấu hình) với mật khẩu do người dùng cung cấp.
2. Một **bộ sinh số giả ngẫu nhiên** (seeded từ mật khẩu) được dùng để xác định vị trí nhúng trong ảnh.
3. Đối với ảnh JPEG: công cụ thay đổi **các hệ số DCT** (Discrete Cosine Transform coefficients) tại những vị trí ít ảnh hưởng đến chất lượng hình ảnh.
4. Đối với ảnh BMP: công cụ thay đổi **giá trị màu trong palette** hoặc trực tiếp tại các pixel.
5. Steghide điều chỉnh các cặp điểm ảnh theo nguyên tắc tối thiểu hóa thay đổi thị giác (minimum distortion embedding), giúp ảnh kết quả trông không khác biệt so với bản gốc.

**Đặc điểm bảo mật:**
- Khi không có mật khẩu: dữ liệu vẫn được nhúng nhưng với key rỗng, dễ bị brute-force.
- Khi có mật khẩu: AES-128 đảm bảo payload không thể đọc được nếu không biết mật khẩu.
- **Stegseek** là công cụ brute-force chuyên dụng cho steghide, có thể thử toàn bộ wordlist chỉ trong vài giây.

#### Cơ chế trong ứng dụng

```
Lệnh: steghide.exe extract -sf <file> -p <password> -f
Thư mục làm việc: Steg/steghide/
```

**Tính năng tự động retry** — một điểm thiết kế thông minh của ứng dụng:

Khi steghide in ra thông báo *"please specify a file name for the extracted data"* (tức là payload được nhúng không kèm tên file), ứng dụng sẽ tự động thêm tham số `-xf secret.txt` và chạy lại lệnh:

```csharp
// MainAppUI.cs:258–286
if (e.Data.IndexOf("please specify a file name for the extracted data", ...) >= 0) {
    string newCommand = command + " -xf secret.txt";
    Spawn($"/c {newCommand}"); // retry
}
```

Sau khi extract thành công, ứng dụng đọc file kết quả và hiển thị nội dung trong RichTextBox:
```
Kết quả: Steg/steghide/secret.txt hoặc secret.txt.gz
```

#### Ứng dụng điều tra

- Đây thường là bước đầu tiên khi nghi ngờ một ảnh JPEG có ẩn giấu thông tin theo phương pháp phổ biến.
- Nên thử với mật khẩu rỗng trước; nếu thất bại, thử tiếp bằng wordlist phổ biến.
- Kết quả sau khi extract được gửi trực tiếp lên **AI Agent** để phân tích nội dung.

![Steghide Tab — giao diện nhập mật khẩu và xem kết quả extract](/posts/nckh-2025/attachments/img_steghide_tab.png)
*[Ảnh minh hoạ: `img_steghide_tab.png`]*

---

### 3.2 ExifTool — Khai Thác Metadata

**ExifTool** là công cụ đọc và ghi metadata mạnh nhất hiện nay, hỗ trợ hàng trăm định dạng file và hàng nghìn trường metadata khác nhau.

#### Nguyên lý — Metadata là gì?

**EXIF (Exchangeable Image File Format)** là chuẩn metadata được nhúng trực tiếp vào file ảnh. Một ảnh JPEG chụp bằng điện thoại thông thường sẽ chứa các trường sau:

| Trường | Thông tin | Ý nghĩa điều tra |
|---|---|---|
| `Make`, `Model` | Thương hiệu, model máy ảnh | Định danh thiết bị |
| `DateTimeOriginal` | Thời điểm chụp | Xác định timeline sự kiện |
| `GPSLatitude`, `GPSLongitude` | Tọa độ GPS | Định vị địa điểm thực tế |
| `Software` | Phần mềm chỉnh sửa | Phát hiện dấu hiệu giả mạo |
| `UserComment` | Trường bình luận tùy ý | Nơi có thể ẩn payload |
| `ImageDescription` | Mô tả ảnh | Có thể chứa thông tin ẩn |
| `XMP:*` | Metadata mở rộng | Lưu dữ liệu tùy chỉnh |

Ngoài EXIF, ExifTool còn đọc được: **IPTC** (thông tin báo chí), **XMP** (metadata Adobe), **ICC Profile**, **thumbnail nhúng**, và nhiều loại metadata khác.

#### Cơ chế trong ứng dụng

```
Lệnh: exiftool.exe -a <file>
Flag -a: hiển thị tất cả các tag, kể cả những tag xuất hiện nhiều lần (duplicate)
```

Output được ứng dụng capture đồng bộ và xử lý như sau:
```csharp
// MainAppUI.cs:428–431
string stdout = await RunAndCaptureStdoutAsync("exiftool.exe -a " + File_path, stegDir);
Exiftool_output_TextBox.Text = stdout.Replace(" : ", " > ");
// Thay ": " bằng "> " để kết quả dễ đọc hơn trong giao diện
```

Nút **"Send to AI"** cho phép gửi toàn bộ metadata lên AI Agent để phân tích ngữ nghĩa.

#### Ứng dụng điều tra thực tế

**Scenario 1 — Truy vết địa điểm:**
```
GPS Latitude  > 10 deg 46' 30.00" N
GPS Longitude > 106 deg 42' 30.00" E
→ AI Agent: "Tọa độ 10.775°N, 106.708°E — khu vực Quận 3, TP.HCM, Việt Nam"
```

**Scenario 2 — Phát hiện giả mạo:**
```
DateTimeOriginal  > 2024:01:15 08:30:00
FileModifyDate    > 2024:03:20 14:22:11
Software          > Adobe Photoshop 2024
→ Dấu hiệu: ảnh đã bị chỉnh sửa sau khi chụp; timestamp không nhất quán
```

**Scenario 3 — Tìm payload ẩn:**
```
UserComment > 5pWw5oiW6K+V5LqGYmFzZTY0...
→ AI Agent nhận ra: "Đây là chuỗi base64 — giải mã ra văn bản ẩn"
```

![ExifTool output — hiển thị metadata đầy đủ của ảnh](/posts/nckh-2025/attachments/img_exiftool_tab.png)
*[Ảnh minh hoạ: `img_exiftool_tab.png`]*

---

### 3.3 Bit-plane (LSB/MSB) Extractor — Phân Tích Từng Tầng Bit

Đây là công cụ phân tích steganography ở cấp độ bit, linh hoạt nhất trong toàn bộ bộ công cụ.

#### Nguyên lý — Mô hình bit của pixel

Mỗi pixel trong ảnh RGBA có **4 kênh màu**, mỗi kênh được biểu diễn bằng **8 bit** (giá trị từ 0 đến 255):

```
Pixel (R=200, G=100, B=50, A=255)

Red:   11001000  (bit7=1, bit6=1, bit5=0, bit4=0, bit3=1, bit2=0, bit1=0, bit0=0)
Green: 01100100
Blue:  00110010
Alpha: 11111111
```

**LSB (Least Significant Bit) — Bit thấp nhất:**
- Bit 0 của mỗi kênh là bit có ảnh hưởng nhỏ nhất đến giá trị màu (chỉ thay đổi ±1).
- Ví dụ: `Red=200 (11001000)` → nhúng bit '1': giá trị thành `201 (11001001)` — màu sắc gần như không thay đổi.
- **Dung lượng**: 1 bit/kênh/pixel. Ảnh 1920×1080 với 3 kênh màu có thể chứa tới ~777.600 bits ≈ **97 KB payload**.

**MSB (Most Significant Bit) — Bit cao nhất:**
- Bit 7 là bit quyết định phần lớn giá trị màu sắc.
- Trong ảnh tự nhiên, MSB-plane trông như phiên bản nhị phân của ảnh gốc.
- Nếu MSB-plane xuất hiện pattern nhiễu bất thường, đó có thể là dấu hiệu của steganography.

**Phân tích bit-plane — Tách ảnh thành 32 tầng:**
- Ảnh được tách thành 32 "tầng" (4 kênh × 8 bit), mỗi tầng là một ảnh nhị phân (đen/trắng) thể hiện giá trị của 1 bit tương ứng.
- **Bit-plane 0–2**: Trong ảnh tự nhiên, các tầng này trông như nhiễu ngẫu nhiên.
- **Nếu bit-plane thấp xuất hiện pattern rõ ràng** (chữ, hình, cấu trúc có quy luật): đó là dấu hiệu mạnh của steganography.

#### Thông số cấu hình linh hoạt

Dialog **BitSelector** (từ `BitSelectorControl.cs`) cho phép người dùng tùy chỉnh hoàn toàn các thông số trích xuất:

```
┌─────────────────────────────────────────────────────┐
│  Type:        [LSB ▼]  [Row ▼]  [RGB ▼]             │
│                                                     │
│  ALPHA     RED      GREEN    BLUE                   │
│  □ bit 7   □ bit 7  □ bit 7  □ bit 7                │
│  □ bit 6   □ bit 6  □ bit 6  □ bit 6                │
│  □ bit 5   □ bit 5  □ bit 5  □ bit 5                │
│  □ bit 4   □ bit 4  □ bit 4  □ bit 4                │
│  □ bit 3   □ bit 3  □ bit 3  □ bit 3                │
│  □ bit 2   □ bit 2  □ bit 2  □ bit 2                │
│  □ bit 1   □ bit 1  □ bit 1  □ bit 1                │
│  ■ bit 0   ■ bit 0  ■ bit 0  □ bit 0  ← LSB RGB     │
└─────────────────────────────────────────────────────┘
```

- **Type**: Chọn LSB (đọc bit thấp) hoặc MSB (đọc bit cao).
- **Orientation**: Chọn Row-first (duyệt theo hàng) hoặc Column-first (duyệt theo cột).
- **Channel order**: 6 hoán vị có thể lựa chọn — RGB, RBG, GRB, GBR, BRG, BGR.
- **Bit mask**: 32 checkbox độc lập — chọn bất kỳ tổ hợp nào trong 4 kênh × 8 bit.

**Lệnh sinh ra:**
```
Extract_SB.exe <file> output.bin <rowFirst> <type> <rgbOrder> 
               <alpha_8bits> <red_8bits> <green_8bits> <blue_8bits> <output_type>
```

**Ví dụ:** Chọn LSB, Row-first, RGB order, lấy bit 0 của R+G+B:
```
Extract_SB.exe image.png output.bin True True 1 00000000 00000001 00000001 00000001 both
```

#### Ứng dụng điều tra

- Trong CTF: nên thử cấu hình LSB bit-0 của tất cả kênh theo thứ tự RGB trước — đây là cấu hình phổ biến nhất.
- Nếu không cho kết quả: thử MSB, thử column-first, hoặc thử các hoán vị channel order khác nhau.
- Kết quả binary dump được gửi lên AI Agent để nhận dạng pattern.

![LSB/MSB Dialog với 32 checkbox bit selection](/posts/nckh-2025/attachments/img_lsb_msb_dialog.png)
*[Ảnh minh hoạ: `img_lsb_msb_dialog.png`]*

![Kết quả LSB extraction — binary dump](/posts/nckh-2025/attachments/img_lsb_msb_result.png)
*[Ảnh minh hoạ: `img_lsb_msb_result.png`]*

---

### 3.4 Shift Bit Color — Trực Quan Hóa Bit-plane

**Shift Bit Color** giúp điều tra viên quan sát trực tiếp bằng mắt toàn bộ 32 bit-plane của một ảnh.

#### Nguyên lý — Khuếch đại bit ẩn

Vấn đề kỹ thuật cần giải quyết: bit-plane 0 chỉ có hai giá trị có thể là `0` hoặc `1`. Nếu hiển thị trực tiếp, toàn bộ ảnh chỉ là các điểm gần-đen (giá trị 0) và gần-đen-hơn-một-chút (giá trị 1), hoàn toàn không thể quan sát được bằng mắt.

Giải pháp: **Dịch bit và khuếch đại** về hai cực trắng–đen:
```
Bit-plane k của kênh C tại pixel (x,y):
  bit_value = (pixel[C] >> k) & 1    // Lấy bit thứ k (kết quả: 0 hoặc 1)
  display   = bit_value × 255         // Khuếch đại: 0 → đen, 1 → trắng
```

Kết quả của quá trình này là 32 ảnh PNG riêng biệt (4 kênh × 8 bit), mỗi ảnh là bản đồ nhị phân đen/trắng của một bit-plane cụ thể.

**Quy trình trong ứng dụng:**
```
1. Gọi Extract_Colour_v2.exe -f <image> -o out
2. Tool tạo ra nhiều file PNG trong thư mục Steg/out/
3. Viewer hiển thị từng ảnh với nút [← Prev] [Next →]
4. Sắp xếp theo NaturalSort (out_1.png, out_2.png, ..., out_32.png)
```

#### Ứng dụng điều tra

Với ảnh tự nhiên, bit-plane 0 (LSB) trông như nhiễu ngẫu nhiên — entropy cao, không có pattern nhận dạng được.

Ngược lại, với ảnh có steganography LSB, bit-plane 0 sẽ hiển thị **cấu trúc có nghĩa** — hình dạng, chữ viết, hay pattern đều đặn. Đây là dấu hiệu trực quan rõ ràng nhất để nhận biết LSB steganography.


![So sánh bit-plane ảnh sạch vs ảnh có steganography](/posts/nckh-2025/attachments/img_bitplane_comparison.png)
*[Ảnh minh hoạ: `img_bitplane_comparison.png`]*

---

### 3.5 XOR Comparator — Lộ Payload Bằng Phép Tính Loại Trừ

**XOR Comparator** khai thác tính chất đặc biệt của phép XOR để phát hiện sự khác biệt giữa hai ảnh.

#### Nguyên lý

Phép XOR (exclusive OR) có hai tính chất quan trọng:
- `a XOR a = 0` — hai giá trị giống nhau cho kết quả bằng 0
- `a XOR b = c` — hai giá trị khác nhau cho kết quả mang thông tin về sự khác biệt đó

Áp dụng vào ảnh:
```
Với mỗi pixel (x,y) tại 2 ảnh img1 và img2:
  result.R = img1.R XOR img2.R
  result.G = img1.G XOR img2.G  
  result.B = img1.B XOR img2.B
```

**Ý nghĩa của kết quả:**
- Nếu hai ảnh giống nhau hoàn toàn → XOR cho ra `(0, 0, 0)` → ảnh kết quả hoàn toàn đen.
- Nếu hai ảnh khác nhau ở một số pixel → XOR lộ ra chính xác những pixel đó, với màu sắc thể hiện mức độ khác biệt.
- Khi so sánh ảnh chứa payload LSB với ảnh gốc sạch → XOR hiển thị rõ ràng từng bit đã bị thay đổi.

**Code thực hiện** (`MainAppUI.cs:993–1022`):
```csharp
Bitmap XorPicture(string path1, string path2) {
    Bitmap bmp1 = new Bitmap(path1);
    Bitmap bmp2 = new Bitmap(path2);
    // Kiểm tra hai ảnh phải có cùng kích thước
    if (bmp1.Width != bmp2.Width || bmp1.Height != bmp2.Height)
        throw new Exception("Images must be the same size");
    
    Bitmap result = new Bitmap(bmp1.Width, bmp1.Height);
    for (int y = 0; y < bmp1.Height; y++)
        for (int x = 0; x < bmp1.Width; x++) {
            Color c1 = bmp1.GetPixel(x, y);
            Color c2 = bmp2.GetPixel(x, y);
            result.SetPixel(x, y, Color.FromArgb(
                c1.R ^ c2.R,  // XOR kênh Red
                c1.G ^ c2.G,  // XOR kênh Green
                c1.B ^ c2.B   // XOR kênh Blue
            ));
        }
    return result;
}
```

Kết quả được lưu vào `xor_result.png` tại thư mục ứng dụng.

#### Ứng dụng điều tra

**Tình huống điển hình trong CTF:**
```
Challenge: "Hai ảnh này trông giống nhau, nhưng có gì đó ẩn trong đó..."
Hành động: Load ảnh 1 và ảnh 2 → thực hiện XOR
Kết quả:   XOR lộ ra chữ "FLAG{hidden_secret}" dưới dạng pattern màu sắc
```

**Tình huống trong điều tra thực tế:**
- So sánh ảnh nghi vấn với ảnh gốc từ nguồn tin cậy để phát hiện watermark ẩn hoặc thông tin đã được nhúng.
- Phát hiện vùng ảnh bị chỉnh sửa bằng Photoshop — các pixel bị thay đổi sẽ sáng lên trong ảnh XOR.

![XOR Comparator — giao diện chọn 2 ảnh và xem kết quả](/posts/nckh-2025/attachments/img_xor_comparator.png)
*[Ảnh minh hoạ: `img_xor_comparator.png`]*

![Kết quả XOR — ảnh 1, ảnh 2, và XOR result](/posts/nckh-2025/attachments/img_xor_before_after.png)
*[Ảnh minh hoạ: `img_xor_before_after.png`]*

---

### 3.6 Edit Size Picture — Khám Phá Thông Qua Chỉnh Sửa Header

**Edit Size Picture** giải quyết một kỹ thuật ẩn giấu đặc thù: **thao túng giá trị kích thước trong header** để che giấu phần dưới hoặc phần phải của ảnh.

#### Nguyên lý — Kỹ thuật "Cropped Header"

Kỹ thuật này hoạt động theo cơ chế sau:
1. Người tạo ảnh tạo một file PNG cao 800px, sau đó nhúng thông tin ẩn vào vùng pixel từ dòng 400 trở xuống.
2. Người đó chỉnh giá trị Height trong header IHDR từ `800` xuống `400`.
3. Bất kỳ trình xem ảnh thông thường nào cũng chỉ hiển thị 400 dòng trên — phần còn lại trở nên "vô hình".
4. Tuy nhiên, toàn bộ dữ liệu ảnh đầy đủ vẫn nằm trong file — chỉ cần sửa lại giá trị header là khôi phục được phần ẩn.

**Dấu hiệu nhận biết:**
```
Kích thước file thực tế: 250 KB
Kích thước lý thuyết (Width × Height × bit_depth / 8): 150 KB
→ Chênh lệch ~100 KB: nghi vấn có dữ liệu bị ẩn
```

#### Cơ chế trong ứng dụng

Khi người dùng load ảnh, ứng dụng đọc trực tiếp các bytes trong header và hiển thị dưới dạng hex:

**Với PNG** — đọc bytes 16–23:
```
Width:  [imageBytes[16]][imageBytes[17]] | [imageBytes[18]][imageBytes[19]]
Height: [imageBytes[20]][imageBytes[21]] | [imageBytes[22]][imageBytes[23]]
(4 bytes big-endian cho mỗi chiều)
```

**Với JPEG** — tìm SOF segment rồi đọc:
```
Width:  [imageBytes[i+7]][imageBytes[i+8]]
Height: [imageBytes[i+5]][imageBytes[i+6]]
(2 bytes big-endian cho mỗi chiều)
```

Người dùng có thể **chỉnh sửa trực tiếp giá trị hex** trong ô TextBox. Sau khi nhập, ứng dụng sẽ lập tức vá lại các bytes trong file và preview ảnh đã khôi phục.

**Converter HEX ↔ Decimal tích hợp** — hỗ trợ số lớn (BigInteger):
```
Hex "0190" → Decimal "400"
Decimal "1920" → Hex "0780"
```

*Lưu ý kỹ thuật:* PNG sử dụng big-endian 4 bytes (hỗ trợ kích thước tối đa 4.294.967.295 pixels), trong khi JPEG chỉ dùng 2 bytes big-endian (tối đa 65.535 pixels). Ứng dụng tự động phát hiện định dạng file và điều chỉnh trường nào được phép chỉnh sửa, trường nào ở chế độ readonly.

#### Ứng dụng điều tra

```
Tình huống: CTF cung cấp một ảnh PNG "bị hỏng" (chỉ hiện thị nửa trên)
Bước 1: Load ảnh → thấy Height = 0x0190 = 400
Bước 2: Tính kích thước file thực: file = 250KB; lý thuyết 400px = 80KB → còn 170KB dữ liệu chưa được hiển thị
Bước 3: Sửa Height từ "0190" lên giá trị thực (thử "0320" = 800)
Bước 4: Preview → phần ẩn hiện ra cùng nội dung flag
```

![Edit Size Picture — giao diện hex editor và converter](/posts/nckh-2025/attachments/img_edit_size.png)
*[Ảnh minh hoạ: `img_edit_size.png`]*

![Trước và sau khi khôi phục header — phần ẩn được lộ ra](/posts/nckh-2025/attachments/img_editsize_restore.png)
*[Ảnh minh hoạ: `img_editsize_restore.png`]*

---

### 3.7 PowerShell Extractor — Kỹ Thuật Lower Nibble B+G

**PowerShell Extractor** là module triển khai một kỹ thuật steganography tùy chỉnh, thường gặp trong các bài CTF và thử thách OSINT.

#### Nguyên lý — Nhúng payload vào 4 bit thấp của kênh B và G

Kỹ thuật này khai thác đặc tính của hệ màu RGB như sau:
- **4 bit thấp (lower nibble)** của mỗi kênh màu khi bị thay đổi sẽ tạo ra sự khác biệt rất nhỏ về thị giác, khó nhận ra bằng mắt.
- Mỗi kênh có thể mang 16 trạng thái khác nhau (2^4) thông qua giá trị lower nibble.
- Khi ghép lower nibble của 2 kênh lại, ta thu được 1 byte dữ liệu (8 bit) được ẩn trong mỗi pixel.

**Công thức nhúng (embed):**
```
Với byte dữ liệu 'data' cần nhúng vào pixel (R, G, B):
  new_B = (B & 0xF0) | (data >> 4)    // 4 bit cao của data → lower nibble của Blue
  new_G = (G & 0xF0) | (data & 0x0F)  // 4 bit thấp của data → lower nibble của Green
```

**Công thức trích xuất (extract):**
```csharp
// PsExtract() — MainAppUI.cs:1024–1060
Color pixel = img.GetPixel(x, y);
int b = pixel.B & 0x0F;               // Lấy 4 bit thấp của kênh Blue
int g = pixel.G & 0x0F;               // Lấy 4 bit thấp của kênh Green
byte value = (byte)((b << 4) | g);    // Ghép thành 1 byte: b làm phần cao, g làm phần thấp
payloadBytes[index++] = value;
```

**Dung lượng:** Mỗi pixel chứa được 1 byte payload. Một ảnh 1920×1080 có thể chứa tới ~2MB dữ liệu ẩn.

**Xử lý trailing nulls:** Sau khi extract toàn bộ, ứng dụng cắt bỏ các byte null thừa ở cuối mảng:
```csharp
int trimmedLength = Array.FindLastIndex(payloadBytes, b => b != 0) + 1;
string payload = Encoding.ASCII.GetString(payloadBytes, 0, trimmedLength);
```

Kết quả được lưu vào `output.txt` và hiển thị trực tiếp trong RichTextBox.

#### Ứng dụng điều tra

Kỹ thuật lower nibble B+G ít phổ biến hơn LSB thuần túy, và thường xuất hiện trong các trường hợp:
- CTF custom challenge với steganography được viết tay bởi người ra đề.
- Malware sử dụng ảnh như kênh C2 communication (gửi lệnh điều khiển qua ảnh).
- Khi LSB thông thường không cho kết quả, thử lower nibble B+G là bước logic tiếp theo.

![PowerShell Extractor — output payload từ ảnh](/posts/nckh-2025/attachments/img_powershell_extractor.png)
*[Ảnh minh hoạ: `img_powershell_extractor.png`]*


---

### 3.8  AI Agent — Phân Tích Tự Động Với DeepSeek

> **Đây là tính năng nổi bật và độc đáo nhất của công cụ** — tích hợp trí tuệ nhân tạo trực tiếp vào quy trình điều tra số.

#### Kiến trúc tổng thể

AI Agent được xây dựng như một cửa sổ phụ độc lập (`AI_Agent` form), kết nối với cửa sổ chính thông qua tham chiếu `mainform`. Điểm đặc biệt về trải nghiệm người dùng: cửa sổ AI Agent hỗ trợ tính năng **snap** — tự động gắn vào cạnh phải hoặc trái của cửa sổ chính, và đồng bộ vị trí theo mỗi lần di chuyển.

```
Snap logic (AI_Agent.cs:60–90):
  |AI Panel| [Main App Window]        [Main App Window] |AI Panel|
  (snap trái)                         (snap phải)
```

**Cấu trúc kỹ thuật:**
- **SDK**: `DeepSeek.Core` — thư viện .NET chính thức cho DeepSeek API
- **Model**: `deepseek-chat` (DeepSeek V3 — mô hình ngôn ngữ lớn chuyên về reasoning)
- **Cấu hình**: Được lưu tại `steg/sourcecode/token.json`:
  ```json
  {
    "DeepSeekAPI": {
      "APIKey": "sk-...",
      "MaxToken": "2048"
    }
  }
  ```

#### Cơ chế gửi dữ liệu tự động

Đây là thiết kế thông minh nhất trong toàn bộ ứng dụng. Thay vì yêu cầu người dùng phải copy-paste thủ công, AI Agent **tự động lắng nghe sự kiện click** trên tất cả các ô output:

```csharp
// AI_Agent.cs:44–53 — RegisterTextBoxEvents()
MainAppUI.OutPut_SB_textBox.MouseClick       += AI_agent_Send;  // LSB/MSB output
MainAppUI.Exiftool_output_TextBox.MouseClick  += AI_agent_Send;  // ExifTool output
MainAppUI.Steghide_tab_Richbox.MouseClick     += AI_agent_Send;  // Steghide output
MainAppUI.Power_Ex_tab_Richbox.MouseClick     += AI_agent_Send;  // PowerShell output
```

**Xử lý thông minh theo nguồn dữ liệu:**
- **OutPut_SB_textBox** (LSB/MSB binary dump): Trước khi gửi, ứng dụng extract phần ASCII có thể đọc được từ hex dump (`ExtractAsciiFromHexDump()`) — giúp loại bỏ noise hex và giữ lại phần thông tin có nghĩa.
- **Exiftool_output_TextBox**: Gửi toàn bộ metadata lên AI để phân tích ngữ nghĩa.
- **Steghide_tab_Richbox** và **Power_Ex_tab_Richbox**: Gửi trực tiếp nội dung payload đã được extract.

#### System Prompt — Định hướng AI

System prompt được thiết kế chuyên biệt cho bối cảnh điều tra số (`AI_Config.cs:227–232`):

```
"You are an OSINT and Digital Forensics expert. Please analyze:
- Code: Detailed analysis
- Coordinates: Determine precise location
- Images/CTF flags: Analyze images and suggest solutions
- Other data: Summarize and conduct in-depth analysis
- Sometimes strange strings like UUUUU, WWW, or many '.' dots may appear,
  which could be hex converted to ASCII, analysis may ignore the '.' dots 
  as they are hex characters that cannot be converted to ASCII format"
```

Prompt này hướng AI tập trung vào bốn nhiệm vụ cốt lõi:
1. **Nhận dạng dữ liệu mã hóa**: base64, hex, ROT13, Caesar cipher.
2. **Phân tích tọa độ GPS**: xác định địa điểm cụ thể trên bản đồ.
3. **Phân tích metadata**: rút trích thông tin có giá trị điều tra.
4. **Gợi ý giải CTF**: đề xuất bước tiếp theo khi phát hiện pattern đặc trưng.

#### Luồng xử lý đầy đủ

```
┌─────────────────────────────────────────────────────────────────┐
│                     Luồng AI Agent                              │
│                                                                 │
│  1. Người dùng chạy tool → kết quả hiển thị trong RichTextBox  │
│  2. Người dùng click vào RichTextBox                            │
│  3. AI_agent_Send() được kích hoạt tự động                      │
│  4. Tiền xử lý dữ liệu (nếu cần: extract ASCII từ hex dump)    │
│  5. Gọi DeepSeekSetting.DeepSeekReq(apiKey, text, maxToken)    │
│  6. Request gửi lên DeepSeek API (timeout: 300 giây)           │
│  7. AI phân tích → trả về response                              │
│  8. Kết quả hiển thị trong Response_boxText_AIagent             │
└─────────────────────────────────────────────────────────────────┘
```

#### Ứng dụng thực tế

**Tình huống 1 — Phân tích tọa độ GPS từ EXIF:**
```
Input:  "GPS Latitude > 10 deg 46' 30.00" N, GPS Longitude > 106 deg 42' 30.00" E"
Output: "Tọa độ 10.7750°N, 106.7083°E tương ứng với khu vực Quận 3, TP. Hồ Chí Minh,
         Việt Nam. Điểm gần nhất: Dinh Độc Lập (~500m về phía Tây)"
```

**Tình huống 2 — Giải mã payload:**
```
Input:  "VGhpcyBpcyBhIHNlY3JldCBtZXNzYWdl"
Output: "Chuỗi này là base64. Giải mã ra: 'This is a secret message'"
```

**Tình huống 3 — Nhận dạng CTF flag:**
```
Input:  "Extracted content: CTF{h1dd3n_1n_pl41n_s1ght}"
Output: "Đây là định dạng flag CTF chuẩn. Flag đã tìm thấy: CTF{h1dd3n_1n_pl41n_s1ght}"
```

**Tình huống 4 — Phân tích dấu hiệu giả mạo từ metadata:**
```
Input:  ExifTool output với DateTimeOriginal và Software fields
Output: "Ảnh được chụp lúc 08:30 ngày 15/01/2024 bằng iPhone 15 Pro.
         Tuy nhiên, FileModifyDate cho thấy file đã bị chỉnh sửa vào ngày 20/03/2024 
         bằng Adobe Photoshop 2024 — đây là dấu hiệu rõ ràng cho thấy ảnh đã bị can thiệp."
```

![AI Agent phân tích payload extract từ steganography](/posts/nckh-2025/attachments/img_ai_agent_payload.png)
*[Ảnh minh hoạ: `img_ai_agent_payload.png`]*

---

## 4. Ứng Dụng Trong Điều Tra Số

Steganography không chỉ là kỹ năng dành cho CTF — kỹ thuật này đã được ghi nhận trong các vụ án thực tế:

- **Liên lạc bí mật**: Các phần tử cực đoan sử dụng ảnh đăng trên mạng xã hội để truyền lệnh cho nhau mà không bị phát hiện.
- **Lọc dữ liệu (Data Exfiltration)**: Kẻ tấn công nhúng tài liệu mật vào ảnh và gửi qua các kênh công khai, vượt qua firewall mà không tạo ra tín hiệu bất thường.
- **Malware C2 Communication**: Botnet nhận lệnh từ hacker thông qua ảnh được đăng công khai trên mạng xã hội (steganographic C2).
- **Thao túng bằng chứng số**: Bằng chứng kỹ thuật số có thể bị làm giả bằng cách nhúng thông tin sai lệch vào ảnh.

---

## 5. Mô Tả Giao Diện Ứng Dụng

### 5.1 Màn Hình Welcome / Dashboard

Màn hình chính sử dụng **TreeView** với checkbox, cho phép người dùng chọn công cụ và cấu hình trực tiếp trên một giao diện duy nhất:

![Main UI](/posts/nckh-2025/attachments/img_main_ui.png)

**Cơ chế mutual-exclusion**: Ứng dụng không cho phép chọn đồng thời "Data Extract", "Resize Image" và "XOR Two Images". Khi một option được chọn, các option xung đột sẽ tự động bị disable (greyed-out).

**File selector dùng chung**: Ô chọn file ảnh đầu vào được chia sẻ cho tất cả các tab Data Extract.

Sau khi hoàn tất cấu hình, người dùng nhấn **Next** để ứng dụng chạy tuần tự tất cả các công cụ đã chọn.



### 5.2 Các Tab Chức Năng

Mỗi công cụ có một tab riêng biệt, gồm các thành phần:
- **Input**: Ô hiển thị lệnh sẽ được thực thi (readonly, phục vụ debug).
- **Output**: RichTextBox hiển thị kết quả — click vào để gửi lên AI Agent.
- **Nút "Send to AI"**: Cho phép kích hoạt AI Agent thủ công.

Tab layout:
![Tab layout](/posts/nckh-2025/attachments/img_tab_layout.png)

### 5.3 Loading Overlay

Khi ứng dụng đang thực thi, toàn bộ form sẽ bị "freeze" (tất cả control bị disable) và một loading overlay sẽ hiển thị lên trên. Cơ chế này ngăn người dùng thực hiện thao tác trùng lặp trong khi công cụ đang chạy.

---

## 6. Cách Nhận Diện Ảnh Có Ẩn Giấu Thông Tin

Dưới đây là các chỉ số nhận biết (indicators of compromise — IoC) thường được dùng khi phân tích ảnh nghi vấn:

### Chỉ số định lượng

| Chỉ số | Ngưỡng bình thường | Nghi vấn khi |
|---|---|---|
| Kích thước file / (W×H×depth/8) | ~1.0–1.5× (nén) | > 2× |
| Entropy bit-plane 0 | ~1.0 (gần ngẫu nhiên) | < 0.8 (có pattern) |
| Số lượng metadata fields | 10–30 trường | > 50 trường hoặc UserComment có độ dài bất thường |
| Chi-square p-value (LSB test) | > 0.05 | < 0.001 |

### Chỉ số định tính

1. **Magic bytes bất thường**: File có phần mở rộng `.jpg` nhưng magic bytes thực tế là PNG (hoặc ngược lại).
2. **Metadata mâu thuẫn**: DateTimeOriginal khác FileModifyDate, kết hợp với trường Software = Photoshop.
3. **Bit-plane thấp có pattern**: Quan sát qua Shift Bit Color — nếu bit-plane 0 hiện rõ chữ hoặc hình thì đây là dấu hiệu đáng ngờ.
4. **Steghide detect được**: Lệnh `steghide info <file>` trả về thông tin về payload dù chưa có mật khẩu.
5. **Kích thước header sai**: Công cụ Edit Size Picture cho thấy Width/Height không khớp với kích thước file thực tế.
6. **Trailing data sau EOI**: Với JPEG, nếu tồn tại dữ liệu sau marker kết thúc `FF D9` (End of Image) thì đây là dấu hiệu bất thường.

---

## 7. Kết Quả Thực Nghiệm

### 7.1 Thực Nghiệm: Steghide trên ảnh chessboard.png

**Môi trường**: File `chessboard.png` được đính kèm sẵn trong thư mục `steg/` của ứng dụng.

**Thực hiện**:
```
Công cụ: Steghide
File: chessboard.png
Password: (thử rỗng)
```

**Kết quả**: Extract thành công các file:
- `secret.txt` — văn bản ẩn
- `secret.txt.gz` — file nén ẩn
- `hearme.txt` — thông điệp
- `flag.txt` — flag CTF

![Kết quả extract Steghide thành công](/posts/nckh-2025/attachments/img_steghide_result.png)
*[Ảnh minh hoạ: `img_steghide_result.png`]*

### 7.2 Thực Nghiệm: PowerShell Extractor trên ảnh CTF

**Thực hiện**: Load ảnh CTF challenge → chạy PowerShell Extractor.

**Kết quả**: File `output.txt` chứa chuỗi ASCII có nghĩa, không phải dữ liệu ngẫu nhiên — điều này xác nhận ảnh đã sử dụng kỹ thuật lower nibble B+G.

**Phân tích AI**: AI nhận diện chuỗi là encoded flag và đề xuất các bước giải mã tiếp theo.

![PowerShell Extractor — kết quả extract payload](/posts/nckh-2025/attachments/img_psextract_result.png)
*[Ảnh minh hoạ: `img_psextract_result.png`]*

### 7.3 Thực Nghiệm: Phân Tích Bit-plane với Shift Bit Color

**Quan sát với ảnh có LSB steganography:**
- **Bit-plane 7 (MSB)**: Rõ ràng — là phiên bản nhị phân của ảnh gốc, trông bình thường.
- **Bit-plane 0 (LSB)**: Xuất hiện cấu trúc rõ ràng (hình chữ nhật, đường thẳng) — đây là **dấu hiệu của steganography**.

**Quan sát với ảnh sạch:**
- **Bit-plane 0**: Chỉ là nhiễu ngẫu nhiên — không có bất kỳ pattern nào nhận dạng được.

![So sánh bit-plane ảnh sạch vs ảnh stego](/posts/nckh-2025/attachments/img_bitplane_comparison.png)
*[Ảnh minh hoạ: `img_bitplane_comparison.png`]*

### 7.4 Thực Nghiệm: AI Agent Phân Tích EXIF

**Input**: EXIF data từ một ảnh thực tế có chứa GPS metadata.

**Kết quả từ AI**: AI xác định được địa điểm chính xác từ tọa độ, nhận dạng thiết bị chụp ảnh, phân tích timeline từ các timestamps, và phát hiện mâu thuẫn trong metadata.

**Thời gian phân tích**: Dưới 5 giây — so với 15–30 phút nếu phân tích thủ công.

![AI Agent phân tích EXIF và định vị GPS](/posts/nckh-2025/attachments/img_ai_analysis.png)
*[Ảnh minh hoạ: `img_ai_analysis.png`]*

---

## 8. Đánh Giá

### Ưu Điểm

| Tính năng | Mô tả |
|---|---|
| **Tích hợp toàn diện** | 8 công cụ chuyên biệt trong 1 giao diện duy nhất — tiết kiệm thời gian chuyển đổi giữa các tool |
| **AI tự động** | Chỉ cần click vào kết quả → AI phân tích ngay, không cần copy-paste thủ công |
| **Linh hoạt bit-plane** | 32 checkbox tùy chỉnh — thử bất kỳ tổ hợp bit nào, không bị giới hạn |
| **Hỗ trợ PNG + JPEG** | Tự động phát hiện định dạng và xử lý header đúng cách |
| **Retry tự động** | Steghide tự retry với `-xf secret.txt` khi thiếu output filename |
| **Snap UX** | Cửa sổ AI Agent tự đồng bộ vị trí với cửa sổ chính |
| **Hex↔Decimal converter** | Tích hợp BigInteger, hỗ trợ số lớn tùy ý |

### Hạn Chế

| Hạn chế | Mô tả |
|---|---|
| **Phụ thuộc tool ngoài** | Steghide, ExifTool và Extract_Colour_v2.exe phải có sẵn trong thư mục `Steg/` |
| **PowerShell Extractor cố định** | Chỉ hỗ trợ 1 kỹ thuật (lower nibble B+G), chưa cho phép tùy chỉnh kênh |
| **Steganalysis thụ động** | Chỉ extract được khi đã biết phương pháp; chưa có steganalysis tự động (chi-square test, RS analysis) |
| **XOR yêu cầu cùng kích thước** | Không hỗ trợ ảnh khác kích thước; cần resize trước khi so sánh |
| **AI phụ thuộc API key** | Cần tài khoản DeepSeek với API key hợp lệ; không hoạt động khi offline |

### Định Hướng Phát Triển

1. **Steganalysis tự động**: Tích hợp chi-square test, RS analysis và Sample Pairs analysis để phát hiện ảnh stego mà không cần biết trước phương pháp.
2. **Brute-force tích hợp**: Tích hợp stegseek để brute-force mật khẩu steghide ngay trong ứng dụng.
3. **Batch processing**: Hỗ trợ phân tích hàng loạt ảnh trong một thư mục chỉ với một lần thực thi.
4. **Report tự động**: Xuất báo cáo điều tra dạng PDF với đầy đủ kết quả và phân tích từ AI.
5. **Offline AI**: Hỗ trợ model AI cục bộ (Ollama) cho các môi trường không có kết nối internet.

---

## 9. Kết Luận

Bài viết này đã trình bày một cách hệ thống về kỹ thuật steganography trong ảnh số — từ nền tảng lý thuyết về định dạng PNG và JPEG, đến 8 phương pháp trích xuất và phân tích thông tin ẩn giấu, cùng với việc tích hợp AI để tự động hóa quá trình phân tích.

**Những điểm cốt lõi cần ghi nhớ:**
- **PNG** phù hợp với ẩn giấu ở cấp độ bit do tính chất lossless; **JPEG** phù hợp hơn với ẩn giấu qua metadata.
- **LSB** là kỹ thuật phổ biến nhất, nhưng **Edit Size Picture** (thao túng header) lại thường bị bỏ qua trong quá trình điều tra.
- **XOR Comparator** cực kỳ hiệu quả khi điều tra viên có ảnh tham chiếu để so sánh.
- **AI Agent** biến đổi quy trình điều tra từ hoàn toàn thủ công sang bán tự động — giảm đáng kể thời gian phân tích.

Công cụ này được xây dựng không chỉ để phục vụ CTF mà còn có giá trị thực tế trong **điều tra số chuyên nghiệp** — nơi mỗi byte trong một file ảnh đều có thể trở thành bằng chứng quan trọng.

---