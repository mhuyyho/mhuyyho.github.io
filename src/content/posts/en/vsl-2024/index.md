---
title: VSL CTF 2024 — Write-up
description: Write-up for VSL CTF 2024 challenges, covering RSA factorization and AES key recovery.
pubDate: 2026-01-01
tags: [CTF, write-up, cryptography, RSA, AES]
categories: [CTF Write-ups]
heroImage: ../../../../assets/images/posts/vsl-2024/cover.png
heroImageAlt: VSL CTF 2024
toc: true
math: true
comments: false
---

# VSL CTF 2024

[Link to Google Drive](https://drive.google.com/drive/folders/1gHDH-aYv7Fiug3Z3YJQODZYl1-DWbxg2?usp=sharing)

## RSA

**Challenge:**

![Screenshot_2](/posts/vsl-2024/attachments/pic_1.png)

**Solution:**

Đọc sơ qua source đề cho và file text, ta thấy $n$ được tạo thành từ chỉ $p$ và $q$ và cả 2 đều 128 bit.

Khả năng cao là phải đi tìm factor của $n$ để tìm được $p$ và $q$.

Trước hết thì mình sẽ up lên [factordb.com](http://factordb.com) để tìm xem trong db có số đó chưa.

![image](/posts/vsl-2024/attachments/pic_2.png)

Và wow, không bất ngờ lắm vì trên đây không có.

Sau đó mình liền triển khai ý tưởng thứ 2 là dùng `factor` của sage để tìm.

Oh, mình chưa suy nghĩ ra cách khác thì hàm đã trả về cho mình $p$ và $q$ luôn rồi 😂.

![image1](/posts/vsl-2024/attachments/pic_3.png)

Khi có được $p$ và $q$ thì mình cứ làm như 1 bài rsa thông thường thôi.

![image2](/posts/vsl-2024/attachments/pic_4.png)

**Flag:** `vsl{RSA_1s_5o_3a5y_h3h3!!}`

---

## Secret Crypto

**Challenge:**

![Screenshot_1](/posts/vsl-2024/attachments/pic_5.png)

Đọc qua code và đề bài thì ta thấy chương trình dùng AES để mã hóa, được cung cấp sẵn Number và Scrambled keys để tìm được K_main.

Phân tích source được cho: Đầu tiên, tạo key có độ dài 16 bằng `os.urandom()` sau đó được pad thêm 1 đoạn "<--- this key" giới hạn key và các bytes ngẫu nhiên. Cuối cùng được encrypt và lưu vào mảng scrambled.

![image3](/posts/vsl-2024/attachments/pic_6.png)

Ở đây, K_main_encrypt được dùng để mod với các n khác nhau được tạo ra, các n này đều có ước chung lớn nhất là p.

![image4](/posts/vsl-2024/attachments/pic_7.png)

Hãy viết lại các quan hệ giữa $K^e$ và các phần tử trong `scrambled_keys`:

$$
\begin{aligned}
(1)\quad & K^e - \text{scrambled\_keys}[0] = a \cdot n_1 \\
(2)\quad & K^e - \text{scrambled\_keys}[1] = b \cdot n_2 \\
(3)\quad & K^e - \text{scrambled\_keys}[2] = c \cdot n_3 \\
(4)\quad & K^e - \text{scrambled\_keys}[3] = d \cdot n_4
\end{aligned}
$$

Lấy hiệu từng cặp và tính GCD để tìm p.

![image5](/posts/vsl-2024/attachments/pic_8.png)

```python
import os, random
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Util.number import *

Ciphertext = bytes.fromhex("1dc3c5d62bf6e24ec677be15d39e7e6d0a719300b45fb02ef69d167d3ec369c8d856f0c718924d45b21466680935615f")
IV = bytes.fromhex("d0c05440bbd86e1ed2a56e8a9fc1c010")

# Scrambled_keys and Number arrays from challenge file

e = 65537
p = 146464744161503014583148424096482522360874905707309860480415277705206571708762878539043643737676991682079785417201983065950650365087460537446415227061703565430386457576865826583490597063070779794441369144408731217999621378381146104830743427389128378760041195806849721982136185389392616726066409753683052124613
N_0 = Number[2] - Number[2] % p
q = N_0 // p
tot = (p - 1) * (q - 1)
d = inverse(e, tot)

K_main = b""
for i in Scrambled_keys:
    K_main_enc = long_to_bytes(pow(i, d, N_0))
    if b"this key" in K_main_enc:
        K_main = K_main_enc.split(b"<--- this key")[0]
        break

cipher = AES.new(K_main, AES.MODE_CBC, IV)
plaintext = unpad(cipher.decrypt(Ciphertext), AES.block_size)
print("Plaintext:", plaintext.decode())
```

**Flag:** `VSL{AES_and_crypto_is_not_easy!!!}`
