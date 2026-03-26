---
title: TL WN722N
description: Cậu bé tinh nghịch và Tp WN722N
date: 2026-03-14
categories:
  - Phần cứng
  - Lab
repositoryUrl:
projectUrl: 
status: Done
image: "[[TL-WN722N.png]]"
imageAlt: TL WN722N.
hideCoverImage: false
hideTOC: false
draft: false
featured: true
aliases:

---
## 1. Giới thiệu thiết bị

### 1.1. Tổng quan
TP-Link TL-WN722N là một thiết bị USB Wireless Adapter được sử dụng để kết nối máy tính với mạng Wi-Fi. Thiết bị hỗ trợ chuẩn IEEE 802.11 b/g/n, hoạt động chủ yếu trên băng tần 2.4 GHz.

### 1.2. Thông số kỹ thuật
- Loại thiết bị: USB Wireless Adapter  
- Chuẩn Wi-Fi: IEEE 802.11 b/g/n  
- Tốc độ tối đa: 150 Mbps (băng tần 2.4 GHz)  
- Giao tiếp: USB 2.0  
- Ăng-ten: 4 dBi (có thể tháo rời, chuẩn RP-SMA)  
- Hệ điều hành hỗ trợ:  
  - Windows  
  - Linux  
  - macOS (phiên bản cũ)  

### 1.3. Công dụng
Thiết bị TL-WN722N được sử dụng trong nhiều mục đích khác nhau:
- Kết nối Wi-Fi cho máy tính không có card mạng không dây  
- Tăng khả năng thu sóng nhờ ăng-ten rời  
- Ứng dụng trong các phòng lab bảo mật (penetration testing)  
- Phân tích và kiểm thử hệ thống mạng không dây  

---

## 2. Các phiên bản phần cứng

| Version | Chipset           | Khả năng Pentest            |
|--------|------------------|-----------------------------|
| V1     | Atheros AR9271   | Tốt (monitor + injection)   |
| V2     | Realtek          | Hạn chế                     |
| V3/V4  | Realtek          | Ít dùng                     |

- Thiết bị đang dùng là: **V2**

---

## 3. Kiến thức nền tảng Wi-Fi (IEEE 802.11)

### 3.1. Wi-Fi là gì
- Công nghệ mạng không dây dùng sóng RF (Radio Frequency)  
- Hoạt động theo chuẩn IEEE 802.11  

### 3.2. Kiến trúc mạng Wi-Fi
- AP (Access Point): phát Wi-Fi  
- Client: thiết bị kết nối  
- SSID (Service Set Identifier): tên mạng  
- BSSID: MAC của AP  

### 3.3. Các chuẩn Wi-Fi

| Chuẩn   | Tốc độ     | Băng tần |
|--------|------------|----------|
| 802.11b | 11 Mbps   | 2.4 GHz  |
| 802.11g | 54 Mbps   | 2.4 GHz  |
| 802.11n | 150–600 Mbps | 2.4/5 GHz |

### 3.4. Công nghệ chính

#### 3.4.1. DSSS (Direct Sequence Spread Spectrum)
- Sử dụng trong chuẩn 802.11b  
- Trải rộng tín hiệu để chống nhiễu tốt  
- Tốc độ tối đa ~11 Mbps  

**Ví dụ:**  
`1 → 101110101`  

#### 3.4.2. OFDM (Orthogonal Frequency Division Multiplexing)
- Sử dụng trong chuẩn 802.11g  
- Chia dữ liệu thành nhiều phần nhỏ, truyền song song  
- Tốc độ lên đến 54 Mbps  

**Ví dụ:**  
`ABCDEFGH → A, B, C, D...`  

#### 3.4.3. MIMO (Multiple Input Multiple Output)
- Sử dụng trong chuẩn 802.11n  
- Dùng nhiều ăng-ten truyền nhiều luồng dữ liệu  
- Tốc độ 150–600 Mbps  

---

## 4. Frame trong Wi-Fi

### 4.1. Các loại frame
- Management Frame → thiết lập & quản lý kết nối  
- Control Frame → điều khiển truy cập kênh truyền  
- Data Frame → truyền dữ liệu người dùng  

### 4.2. Một số frame quan trọng
- Beacon Frame → AP phát định kỳ  
- Probe Request / Probe Response → tìm mạng  
- Authentication Frame → xác thực  
- Association Frame → kết nối  
- Data Frame → dữ liệu thực tế  

---

## 5. Monitor Mode

### 5.1. Khái niệm
- Cho phép nghe toàn bộ traffic Wi-Fi  
- Không cần kết nối mạng  

### 5.2. Các chế độ card Wi-Fi
- Managed Mode  
- Monitor Mode  

### 5.3. Công cụ
- `airmon-ng` → bật monitor mode  
- `airodump-ng` → scan & capture  

### 5.4. Quy trình
1. Kiểm tra interface  
2. Bật monitor mode  
3. Scan mạng  

### 5.5. Cài driver hỗ trợ monitor

```bash
sudo apt update
sudo apt install -y dkms git build-essential

git clone https://github.com/aircrack-ng/rtl8188eus
cd rtl8188eus

sudo make dkms_install
echo "blacklist r8188eu" | sudo tee /etc/modprobe.d/realtek.conf
sudo reboot

iwconfig

sudo airmon-ng check kill
sudo airmon-ng start wlan0
```

---

## 6. Capture WPA/WPA2 Handshake

### 6.1. Khái niệm
- Quá trình xác thực giữa client và AP  
- Sinh khóa mã hóa (PTK, GTK)  

### 6.2. 4 bước handshake
1. ANonce  
2. SNonce  
3. GTK  
4. ACK  

### 6.3. Mục đích
- Dùng để crack mật khẩu offline  

### 6.4. Quy trình
1. Xác định AP  

2. Capture:
```bash
sudo airodump-ng wlan0
```

→ Lấy BSSID và Channel  

3. Chờ client connect:
```bash
sudo airodump-ng -c 11 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0
```

4. Sau khi bắt được handshake → file `.cap`  
→ Dùng để crack password  
- Thành công nếu password nằm trong wordlist  

---

## 7. Deauthentication Attack

### 7.1. Khái niệm
- Gửi frame giả để ngắt kết nối client  

### 7.2. Mục đích
- Bắt handshake  
- Kiểm tra bảo mật  

### 7.3. Công cụ
- `aireplay-ng`  

### 7.4. Quy trình
1. Xác định BSSID  
2. Gửi deauth  
3. Client reconnect → capture handshake  


Gửi frame giả để ngắt kết nối đối với toàn bộ user trong mạng:
```bash
sudo aireplay-ng --deauth 10 -a AA:BB:CC:DD:EE:FF wlan0
```

Gửi frame giả để ngắt kết nối đối với 1 user nhất định trong mạng:
```bash
sudo aireplay-ng --deauth 10 -a AA:BB:CC:DD:EE:FF -c CLIENT_MAC wlan0
```

---

## 8. Tổng kết

### 8.1. Thiết bị TL-WN722N
- Công cụ phổ biến trong lab Wi-Fi  
- Hỗ trợ:
  - Monitor mode  
  - Packet injection  

### 8.2. Ứng dụng
- Phân tích mạng  
- Kiểm thử bảo mật  
- Mô phỏng tấn công Wi-Fi  