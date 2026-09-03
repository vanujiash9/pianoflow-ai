import { forwardRef } from 'react'

import logoImage from '../../../img/logo.jpg'

import { buildWarrantyNotes } from './lib/api'
import type { WarrantyPrintPayload } from './lib/warranty-print-session'
import { SHOP_ADDRESS, SHOP_PHONES, SHOP_TITLE, formatPrintDate, printLabel } from './lib/warranty-print'
interface WarrantyPrintDocumentProps {
  payload: WarrantyPrintPayload
}

export const WarrantyPrintDocument = forwardRef<HTMLDivElement, WarrantyPrintDocumentProps>(function WarrantyPrintDocument({ payload }, ref) {
  return (
    <div className="warranty-print-document" ref={ref}>
      <header className="warranty-print-header">
        <div className="warranty-print-brand">
          <img className="warranty-print-logo-image" src={logoImage} alt="Logo Piano Solna" />
        </div>
        <div className="warranty-print-shopinfo">
          <div className="warranty-print-shopname">{SHOP_TITLE}</div>
          <div className="warranty-print-location-label">Trụ sở chính / Kho TP.HCM:</div>
          <div className="warranty-print-address">{SHOP_ADDRESS}</div>
          <div className="warranty-print-phones">{SHOP_PHONES.map((phone) => <span key={phone}>{phone}</span>)}</div>
        </div>
        <div className="warranty-print-header-spacer" />
      </header>
      <div className="warranty-print-header-line" />
      <div className="warranty-print-title-wrap">
        <div className="warranty-print-main-title">
          <h1>
            PHIẾU <span>BẢO HÀNH</span>
          </h1>
          <div className="warranty-print-ornament">
            <span />
            <b>●</b>
            <b>●</b>
            <b>●</b>
            <span />
          </div>
        </div>
        <div className="warranty-print-code">
          <span>Mã bảo hành:</span>
          <strong>{payload.warrantyCode}</strong>
        </div>
      </div>

      <section className="warranty-print-section warranty-print-section-grid">
        <div className="warranty-print-section-title">
          <span>1</span>
          <strong>THÔNG TIN KHÁCH HÀNG</strong>
        </div>
        <table className="warranty-print-table warranty-print-table-tight">
          <tbody>
            <tr>
              <th>Họ tên khách hàng</th>
              <td>{payload.customerName || ' '}</td>
            </tr>
            <tr>
              <th>Số điện thoại</th>
              <td>{payload.customerPhone || ' '}</td>
            </tr>
            <tr>
              <th>Địa chỉ</th>
              <td>{printLabel(payload.customerAddress) || ' '}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="warranty-print-section warranty-print-section-grid">
        <div className="warranty-print-section-title">
          <span>2</span>
          <strong>THÔNG TIN SẢN PHẨM</strong>
        </div>
        <table className="warranty-print-table warranty-print-table-tight">
          <tbody>
            <tr>
              <th>Sản phẩm</th>
              <td>{payload.pianoName || ' '}</td>
            </tr>
            <tr>
              <th>Serial</th>
              <td>{printLabel(payload.serialNumber) || ' '}</td>
            </tr>
            <tr>
              <th>Bắt đầu</th>
              <td>{payload.startDate ? formatPrintDate(new Date(`${payload.startDate}T00:00:00`)) : ' '}</td>
            </tr>
            <tr>
              <th>Kết thúc</th>
              <td>{payload.endDate ? formatPrintDate(new Date(`${payload.endDate}T00:00:00`)) : ' '}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="warranty-print-section warranty-print-text-section warranty-print-section-grid">
        <div className="warranty-print-section-title">
          <span>3</span>
          <strong>GHI CHÚ</strong>
        </div>
        <div className="warranty-print-notes-box warranty-print-notes-box-tight">
          <div className="warranty-print-notes-content">{payload.notes || ' '}</div>
          <div className="warranty-print-notes-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <div className="warranty-print-footer-note">TP. Hồ Chí Minh, ngày {formatPrintDate(new Date(payload.createdAt))}</div>
      <footer className="warranty-print-signatures">
        <div className="warranty-print-policy-block">
          <div className="warranty-print-policy-title">CHÍNH SÁCH BẢO HÀNH</div>
          <div className="warranty-print-policy-text">
            {buildWarrantyNotes()
              .split('\n')
              .map((line, index) => {
                const isSectionTitle = /^\d+\.\s/.test(line)
                const isBullet = line.startsWith('- ')

                return (
                  <p key={`${index}-${line}`} className={isSectionTitle ? 'is-section-title' : isBullet ? 'is-bullet' : 'is-intro'}>
                    {isBullet ? line.slice(2) : line}
                  </p>
                )
              })}
          </div>
        </div>
        <div className="warranty-print-shop-signature">
          <strong>ĐẠI DIỆN CỬA HÀNG</strong>
          <span>(Ký và ghi rõ họ tên)</span>
          <div className="warranty-print-shop-signature-area">
            <div className="warranty-print-stamp">
              <div className="warranty-print-stamp-ring">
                <small>PIANO SOLNA</small>
                <div>
                  PIANO
                  <br />
                  SOLNA
                </div>
              </div>
            </div>
            <div className="warranty-print-signature-writing">Piano Solna</div>
          </div>
        </div>
      </footer>
    </div>
  )
})
